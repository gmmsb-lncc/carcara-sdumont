#!/bin/bash

# ================================
# Execução do DeepSeek-R1 671B com Multi-GPU (RHEL 9.4)
# ================================

# 🔹 Passo 1: (Opcional) Atualiza e instala dependências do sistema
# sudo dnf makecache && sudo dnf install -y \
#     cmake gcc gcc-c++ make wget git curl unzip python3 python3-pip python3-venv \
#     libcublas openblas-devel openssl-devel libcurl-devel libstdc++ libffi-devel xz-devel

# 🔹 Passo 2: (Opcional) Instala dependências do Python
# pip install --upgrade pip
# pip install huggingface_hub transformers torch torchvision torchaudio numpy scipy pandas tqdm


# 🔹 Função para Configurar Parâmetros (todos os parâmetros serão passados pelo main)
set_parameters() {
    # Os parâmetros são recebidos na seguinte ordem:
    # 1 - MODEL_DIR
    # 2 - TOKENIZER_PATH
    # 3 - VRAM_TOTAL (por GPU, em GB)
    # 4 - GPU_COUNT
    # 5 - TOTAL_LAYERS do modelo
    # 6 - LLAMA_CLI (caminho para o executável)
    MODEL_DIR="$1"
    TOKENIZER_PATH="$2"
    VRAM_TOTAL="$3"
    GPU_COUNT="$4"
    TOTAL_LAYERS="$5"
    LLAMA_CLI="$6"

    echo "🔹 Configurando parâmetros..."

    # Define caminho do modelo e calcula valores derivados
    MODEL_PATH=$(ls "$MODEL_DIR"/*-00001-of-*.gguf | head -n 1)
    RAM_TOTAL=$(awk '/MemTotal/ {printf "%.0f", $2/1024/1024}' /proc/meminfo)
    VRAM_MAX=$((VRAM_TOTAL * GPU_COUNT - 1))   # Reserva 5GB no total
    RAM_MAX=$((RAM_TOTAL * 98 / 100))            # Usa até 98% da RAM total

    GPU_LAYERS="$TOTAL_LAYERS"  # Todas as camadas na GPU
    DISK_LAYERS=0

    # 🔹 Verifica se o modelo e o tokenizador foram baixados corretamente
    if [[ ! -f "$MODEL_PATH" ]]; then
        echo "❌ ERRO: Modelo GGUF não encontrado em $MODEL_PATH!"
        exit 1
    fi

    if [[ ! -d "$TOKENIZER_PATH" ]]; then
        echo "❌ ERRO: Tokenizador não encontrado em $TOKENIZER_PATH!"
        exit 1
    fi

    # 🔹 Verifica se llama-cli está compilado no caminho esperado
    if [[ ! -f "$LLAMA_CLI" ]]; then
        echo "❌ ERRO: 'llama-cli' não encontrado! Compilando..."
        cd /scratch/dockvs/leon.costa/src/llama.cpp
        rm -rf build
        cmake -B build -DBUILD_SHARED_LIBS=OFF -DGGML_CUBLAS=ON
        cmake --build build --config Release -j$(nproc) --clean-first --target llama-cli
        cd -
    fi

    if [[ ! -f "$LLAMA_CLI" ]]; then
        echo "❌ ERRO: Falha na compilação do 'llama-cli'! O script será encerrado."
        exit 1
    fi

    # 🔹 Configurações CUDA e de Memória
    export GGML_CUDA_MALLOC_ASYNC=1
    export GGML_CUDA_PEER_MAX_BATCH_SIZE=1024  # Comunicação eficiente entre GPUs
    export GGML_USE_MLOCK=0  # Permite uso de SWAP (RAM não bloqueada)
    export GGML_USE_MMAP=1   # Ativa cache no HD para camadas que não couberem na RAM

    # 🔹 Define tokens especiais do DeepSeek-R1
    export LLAMA_TOKEN_BOS=0        # Token de início
    export LLAMA_TOKEN_EOS=1        # Token de fim
    export LLAMA_TOKEN_PAD=128815   # Token de padding
    export LLAMA_TOKEN_LF=201       # Token de nova linha
}

main() {
    echo "🔹 Iniciando a execução do script..."
    
    # Pode ser alterado para download_model_quantized_simple
    # Caso altere o método de quantização, atualize também o sufixo de MODEL_DIR
    MODEL_DIR="DeepSeek-V3-0324-GGUF/DeepSeek-V3-0324-UD-Q2_K_XL/"   # Diretório do modelo
    TOKENIZER_PATH="DeepSeek-V3-GGUF/tokenizer"             # Diretório do tokenizador
    VRAM_TOTAL=80                                          # VRAM por GPU (em GB)
    GPU_COUNT=4                                            # Número de GPUs disponíveis
    TOTAL_LAYERS=62                                        # Total de camadas do modelo
    LLAMA_CLI="/scratch/dockvs/leon.costa/src/llama.cpp/build/bin/llama-cli"  # Caminho para o executável

    # 🔹 Configura os parâmetros chamando a função com os argumentos definidos
    set_parameters "$MODEL_DIR" "$TOKENIZER_PATH" "$VRAM_TOTAL" "$GPU_COUNT" "$TOTAL_LAYERS" "$LLAMA_CLI"

    echo "🔹 Executando DeepSeek-R1 671B em MULTI-GPU..."
    echo "📌 Configuração de memória:"
    echo "   - GPUs disponíveis: ${GPU_COUNT}"
    echo "   - Total de camadas carregadas na GPU: ${GPU_LAYERS}"
    echo "   - Camadas na RAM/HD: ${DISK_LAYERS}"
    echo "   - VRAM alocada (total): ${VRAM_MAX}GB"
    echo "   - RAM disponível: ${RAM_MAX}GB"

    START_TIME=$(date +%s)

    CUDA_VISIBLE_DEVICES=0,1,2,3 ./src/llama.cpp/build/bin/llama-server \
        --model "$MODEL_PATH" \
        --flash_attn \
        --cache-type-k q8_0 \
        --threads -1 \
        --ctx-size 16384 \
        --predict 4096 \
        --temp 0.1 \
        --top-k 40 \
        --top-p 0.9 \
        --min-p 0.1 \
        --batch-size 1024 \
        --n-gpu-layers "$GPU_LAYERS" \
        --split-mode layer \
        --host 0.0.0.0 \
        --port 8080 \
        --parallel 2 \
        --cont-batching \
        --threads-http 2 \
        --mlock \
        --no-webui \
        --timeout 180 \
        --metrics \
        --seed 420 \
        --alias carcara-v3-0324 \
        --api-key <ADICIONE_API_AQUI>
        #--chat-template-file system_prompt_template.jinja
        # --prompt "<|User|> Insira seu prompt abaixo! <|Assistant|>"

    END_TIME=$(date +%s)
    EXEC_TIME=$((END_TIME - START_TIME))

    echo "✅ Inferência concluída em ${EXEC_TIME} segundos!"
}

# 🔹 Inicia a execução do script
main
