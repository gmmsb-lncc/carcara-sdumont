# Benchmarking Quantized DeepSeek V3-0324 Models

This directory contains the benchmarking scripts employed in the Carcará platform to evaluate the inference efficiency of dynamically quantized variants of the **DeepSeek V3-0324** model. These evaluations were conducted on the **Santos Dumont Supercomputer**, operated by the **Laboratório Nacional de Computação Científica (LNCC)**.

## Objective

The benchmark procedure aims to systematically assess:

- **Text generation throughput (tokens per second)** under varying prompt parallelism.
- **Maximum context length (in tokens)** supported before triggering out-of-memory (OOM) errors.

The outcomes provide practical insights for deployment trade-offs in high-performance inference scenarios using quantized large language models (LLMs).

---

## Evaluated Models

The following dynamically quantized variants of DeepSeek V3-0324 were evaluated:

| Model Variant | Quantization Precision (bits) | Approx. Model Size (GB) |
|---------------|-------------------------------|--------------------------|
| `iq1_s`       | ~1.78                         | 186                      |
| `iq1_m`       | ~1.93                         | 196                      |
| `iq2_xxs`     | ~2.42                         | 219                      |
| `q2_k_xl`     | ~2.71                         | 248                      |

All models are quantized in the [GGUF](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md) format and executed entirely within GPU memory, avoiding inter-GPU synchronization.

---

## Infrastructure and Execution Setup

- **Inference Engine:** [`llama-batched-bench`](https://github.com/ggerganov/llama.cpp)
- **Hardware Configuration:** 4 × NVIDIA H100 80GB GPUs per node
- **Execution Mode:** Layer-wise parallelism (`--split-mode layer`)
- **Key Parameters:**
  - Batch size (`-b`): 512
  - Tokens generated (`-n`): 256
  - Context window (`-c`): variable (provided as script argument)
  - Device binding: `"CUDA0,CUDA1,CUDA2,CUDA3"`
  - GPU layers: `-ngl 62`
  - Flash attention enabled: `--flash-attn`

Each script executes a benchmark for a given context size, storing results in `.jsonl` format.

---

## Usage

Make the script executable and run it with a desired context size (in tokens):

```bash
chmod +x run_benchmark_iq1_m.sh
./run_benchmark_iq1_m.sh 8192
````

Repeat this process for the other model variants: `iq1_s`, `iq2_xxs`, `q2_k_xl`.

The output will be saved to a file named according to the context and model variant, e.g.:

```
benchmark_deepseek_v3_iq1_m_b512_ctx8192.jsonl
```

---

## Metrics

### 1. Text Generation Throughput (tokens/second)

* Measured as the aggregate generation speed across all tokens and threads.
* Crucial for determining system responsiveness, particularly in multi-user scenarios.

### 2. Maximum Supported Context Length

* Determined by incrementally increasing the input context until memory limits are reached.
* Critical for applications involving long-form content such as code completion, document processing, and multi-turn dialogues.

---

## Rationale and Advantages

This benchmarking strategy offers several technical benefits:

* **Production-aligned:** Benchmarks are conducted under realistic deployment settings using actual inference binaries.
* **Controlled experimentation:** Fixed parameters (e.g., batch size, number of tokens) allow isolated analysis of quantization effects.
* **Resource-aware:** Context limits directly inform hardware provisioning and user capacity planning.
* **Quantization insights:** Enables trade-off analysis between model compression and runtime performance.

This methodology mirrors the approach reported in the technical communication *"Efficient Deployment of a 685B-Parameter Open-Source LLM on Brazil’s Santos Dumont Supercomputer"* and underpins the scaling strategy of the Carcará platform.

---

## Reproducibility

All scripts are designed to be fully reproducible in HPC environments that support `llama.cpp`, CUDA, and multi-GPU scheduling (e.g., via Slurm).

Ensure appropriate environmental variables (e.g., `CUDA_VISIBLE_DEVICES`) and dependencies are satisfied.
