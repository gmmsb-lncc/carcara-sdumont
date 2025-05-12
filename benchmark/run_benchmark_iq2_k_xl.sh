#!/bin/bash


# Verifica se o argumento foi passado
if [ -z "$1" ]; then
  echo "Uso: $0 <CTX_SIZE>"
  exit 1
fi

CTX_SIZE="$1"

# Caminhos fixos
LLAMA_BIN="/scratch/dockvs/leon.costa/src/llama.cpp/build/bin/llama-batched-bench"
MODEL_PATH="/scratch/dockvs/leon.costa/DeepSeek-V3-0324-GGUF/DeepSeek-V3-0324-UD-Q2_K_XL/DeepSeek-V3-0324-UD-Q2_K_XL-00001-of-00006.gguf"
DEVICES="CUDA0,CUDA1,CUDA2,CUDA3"

# Parâmetros fixos
NTOKENS=256
UBATCH=512
NPP=256
NTG=256
NPL_OPTS="-npl 1"
NGPULAYERS=62

# Lista de batch sizes
BATCH_SIZES=(512)

# Execução em loop
for BATCH in "${BATCH_SIZES[@]}"; do
  OUTPUT_FILE="benchmark_deepseek_v3_q2_k_xl_b${BATCH}_ctx${CTX_SIZE}.jsonl"


  echo "Executando benchmark para batch size ${BATCH} com contexto ${CTX_SIZE}..."
  
  CUDA_VISIBLE_DEVICES=0,1,2,3 $LLAMA_BIN \
    -m "$MODEL_PATH" \
    -b "$BATCH" \
    -c "$CTX_SIZE" \
    -n "$NTOKENS" \
    -ub "$UBATCH" \
    -npp "$NPP" \
    -ntg "$NTG" \
    $NPL_OPTS \
    --device "$DEVICES" \
    --split-mode layer \
    -ngl "$NGPULAYERS" \
    --threads -1 \
    --flash-attn \
    --output-format jsonl > "$OUTPUT_FILE"

  echo "Saída salva em: $OUTPUT_FILE"
done

echo "Todos os benchmarks foram concluídos."

