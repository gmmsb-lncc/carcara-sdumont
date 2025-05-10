# serve run chat_router:app
from __future__ import annotations
import os
import json
import logging
import asyncio
from typing import AsyncGenerator
from dataclasses import dataclass
from dotenv import load_dotenv
from tokenizers import Tokenizer

from ray import serve
from starlette.requests import Request
from starlette.responses import StreamingResponse, JSONResponse
import aiohttp
from pydantic import BaseModel, ValidationError

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

N_ENDPOINT = 4 # numero de nós disponiveis

@dataclass
class Node:
    endpoint: str
    api_key: str
    max_context_length: int

class ChatRequest(BaseModel):
    messages: list[dict[str, str]]
    stream: bool = True
    temperature: float = 0.7
    top_p: float = 0.9
    max_tokens: int = 8192

@serve.deployment
class ChatRouter:
    def __init__(self) -> None:
        self.nodes = self._load_nodes()
        self.current_index = 0
        self.lock = asyncio.Lock()
        self.session = aiohttp.ClientSession()
        self.tokenizer = Tokenizer.from_file("tokenizer.json")

    def _load_nodes(self) -> list[Node]:
        nodes = []
        for i in range(1, N_ENDPOINT + 1):  # GENERALIZAR ESSE LOOP PARA N NÓS
            endpoint = os.getenv(f"NODE{i}_ENDPOINT")
            api_key = os.getenv(f"NODE{i}_API_KEY")
            context_str = os.getenv(f"NODE{i}_MAX_CONTEXT")
            if endpoint and api_key:
                try:
                    max_context = int(context_str) if context_str else 4096
                except ValueError:
                    logger.warning(f"NODE{i}_MAX_CONTEXT inválido, usando valor padrão 4096")
                    max_context = 4096
                nodes.append(Node(endpoint=endpoint, api_key=api_key, max_context_length=max_context))
        if not nodes:
            raise RuntimeError("Nenhum nó válido foi configurado")
        return nodes

    def _count_tokens(self, messages: list[dict], node: Node) -> int:
        tokens_per_message = 3
        tokens_per_name = 1
        num_tokens = 0
        for message in messages:
            num_tokens += tokens_per_message
            for key, value in message.items():
                num_tokens += len(self.tokenizer.encode(value).ids)
                if key == "name":
                    num_tokens += tokens_per_name
        num_tokens += 3
        return num_tokens

    async def _next_node(self) -> Node:
        async with self.lock:
            node = self.nodes[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.nodes)
        return node

    async def _call_model(self, node: Node, payload: dict) -> AsyncGenerator[str, None]:
        headers = {
            "Authorization": f"Bearer {node.api_key}",
            "Content-Type": "application/json"
        }
        try:
            async with self.session.post(
                node.endpoint,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=600)
            ) as response:
                if response.status != 200:
                    error = await response.text()
                    logger.error(f"Model error: {error}")
                    yield json.dumps({"error": f"Model error: {error}"})
                    return
                async for chunk in response.content:
                    yield chunk.decode("utf-8")
        except aiohttp.ClientError as e:
            logger.error(f"Connection error: {str(e)}")
            yield json.dumps({"error": str(e)})

    async def _truncate_messages_sliding_window(self, messages: list[dict], node: Node, reserved_tokens: int) -> list[dict]:
        original = messages.copy()
        effective_context = max(0, node.max_context_length - reserved_tokens)
        token_count_before = self._count_tokens(original, node)
        logger.info(f"[TRUNCATE] Tokens totais recebidos: {token_count_before}, contexto efetivo permitido: {effective_context}, tokens reservados: {reserved_tokens}")

        system_messages = []
        if original and original[0]["role"] == "system":
            system_messages = original[:1]
            original = original[1:]

        if not original:
            return system_messages

        user_message = original[-1]
        other_messages = original[:-1]

        removed = 0
        while self._count_tokens(system_messages + other_messages + [user_message], node) > effective_context and len(other_messages) > 1:
            remove_count = max(1, len(other_messages) // 2)
            logger.info(f"[TRUNCATE] Removendo {remove_count} mensagens antigas (sliding window)")
            other_messages = other_messages[remove_count:]
            removed += remove_count

        # Truncar user message se ainda necessário
        token_count = self._count_tokens(system_messages + other_messages + [user_message], node)
        if token_count > effective_context:
            user_content = user_message["content"]
            encoded = self.tokenizer.encode(user_content).ids
            base_tokens = self._count_tokens(system_messages + other_messages, node) + 3
            max_allowed = effective_context - base_tokens
            logger.info(f"[TRUNCATE] Truncando mensagem final do usuário para {max_allowed} tokens")
            if max_allowed > 0:
                user_message["content"] = self.tokenizer.decode(encoded[:max_allowed])
            else:
                user_message["content"] = ""

        final_messages = system_messages + other_messages + [user_message]
        final_tokens = self._count_tokens(final_messages, node)

        logger.info(f"[TRUNCATE] Tokens finais enviados: {final_tokens}, mensagens removidas: {removed}")

        return final_messages

    async def __call__(self, request: Request) -> StreamingResponse | JSONResponse:
        try:
            payload = await request.json()
            chat_request = ChatRequest(**payload)

            if not chat_request.messages:
                return JSONResponse({"error": "Empty message list"}, status_code=400)

            if chat_request.messages[-1]["role"] != "user":
                return JSONResponse({"error": "Last message must be from user"}, status_code=400)

            node = await self._next_node()

            # 🔒 Aqui forçamos: no máximo 4096 tokens no prompt (metade do contexto total)
            prompt_limit = node.max_context_length // 2
            reserved_tokens = node.max_context_length - prompt_limit

            logger.info(f"[ROUTER] Roteando para {node.endpoint}")
            logger.info(f"[CONTEXT] Reservado {reserved_tokens} tokens para resposta")
            logger.info(f"[CONTEXT] Máximo permitido para prompt = {prompt_limit} tokens")

            # Trunca o prompt para caber no limite
            truncated_messages = await self._truncate_messages_sliding_window(
                chat_request.messages, node, reserved_tokens
            )

            final_prompt_tokens = self._count_tokens(truncated_messages, node)
            logger.info(f"[FINAL] Prompt com {final_prompt_tokens} tokens (limite era {prompt_limit})")

            new_payload = chat_request.dict()
            new_payload["messages"] = truncated_messages

            return StreamingResponse(
                self._call_model(node, new_payload),
                media_type="text/event-stream"
            )

        except ValidationError as e:
            logger.warning(f"[VALIDATION] Requisição inválida: {str(e)}")
            return JSONResponse({"error": "Invalid request format", "details": str(e)}, status_code=400)
        except Exception as e:
            logger.error(f"[ERROR] Erro inesperado: {str(e)}")
            return JSONResponse({"error": "Internal server error"}, status_code=500)


    async def shutdown(self) -> None:
        await self.session.close()

app = ChatRouter.bind()
