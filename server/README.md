# Initialization of `llama-server` Multi-GPU

This script is designed to facilitate the execution of the **DeepSeek-V3-0324 685b** model in environments with multiple GPUs, using the `llama-server` compiled with CUDA support.

---

## Purpose

The script automatically performs:

- Environment and CUDA variable configuration;
- Checks and compiles the `llama-cli` executable if needed;
- RAM and VRAM memory limits calculation;
- Execution of `llama-server` with optimized parameters;
- (Optionally) download of the model and tokenizer via HuggingFace.

---

## Multi-Node Environment Usage

This repository assumes that multiple inference nodes will run separate instances of the `llama-server`, each with its own **unique API Key** and listening on a **different port**.

To do this, we recommend using this script as a **base template** and creating personalized copies for each node:

### Example:

```bash
cp carcara_v3_server.sh carcara_v3_server_node1.sh
cp carcara_v3_server.sh carcara_v3_server_node2.sh
cp carcara_v3_server.sh carcara_v3_server_node3.sh
cp carcara_v3_server.sh carcara_v3_server_node4.sh
```

Each copied script must be **manually edited** to configure:

- Server port (`--port`);
- Model alias (`--alias`);
- The node's unique API key (`--api-key`);
- Log or status filename, if needed, for differentiation.

> ⚠️ **Important:**  
> The `--api-key` field is already included in the `llama-server` command, but as a placeholder:
>
> ```bash
> --api-key <INSERT_API_HERE>
> ```
> Replace this value with the correct key before executing the script.

---

## Script Structure

### Main parameters defined in `main()`:

- `MODEL_DIR`: Directory containing `.gguf` shards;
- `TOKENIZER_PATH`: Path to the tokenizer;
- `VRAM_TOTAL`: Video memory per GPU (in GB);
- `GPU_COUNT`: Number of available GPUs;
- `TOTAL_LAYERS`: Total model layers;
- `LLAMA_CLI`: Path to the `llama-cli` executable.

### Final Execution:

The script runs the `llama-server` binary with optimized parameters:

- Enables flash attention (`--flash_attn`);
- Sets context size (`--ctx-size`);
- Configures batch size, parallelism, HTTP streaming;
- Sets layers allocated on GPU (`--n-gpu-layers`);
- Points to the correct node port (`--port`);
- Uses `--alias` to name the server;
- Requires an API key (`--api-key`).

---

## Dependencies (optional)

Install required libraries for model download:

```bash
pip install --upgrade pip
pip install huggingface_hub transformers torch torchvision torchaudio numpy scipy pandas tqdm
```

System dependencies (for compilation and environment setup):

```bash
sudo dnf install -y \
    cmake gcc gcc-c++ make wget git curl unzip python3 python3-pip python3-venv \
    libcublas openblas-devel openssl-devel libcurl-devel libstdc++ libffi-devel xz-devel
```

---

## Model Download Commands

Use one of the functions at the top of the script, as needed:

- `download_model_quantized_simple`: downloads only the quantized `.gguf` files.
- `download_model_quantized_complete`: downloads the model + tokenizer.

Uncomment the corresponding line inside `main()` to enable.

---

## Notes

- The script automatically detects and recompiles `llama-cli` if not found.
- RAM and VRAM usage is calculated based on the provided parameters.
- CUDA environment variables can be adjusted directly in the script depending on the infrastructure.

---

## Execution

After properly configuring the parameters in `main()` and adding your API key, run:

```bash
bash carcara_v3_server_nodeN.sh
```

Replace `N` with the corresponding node number.

---

## License

This script was developed for use in distributed inference environments focused on quantized models from the DeepSeek family. It may be freely adapted for other GGUF models compatible with `llama.cpp`.
