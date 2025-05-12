[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.15390358.svg)](https://doi.org/10.5281/zenodo.15390358)

# Carcará Setup

This repository gathers instructions to configure a multi-GPU environment, run and set up `llama.cpp` with CUDA 12.6 support on RHEL 9.4.

## Installation and Configuration of `llama.cpp`

This section describes how to set up and compile `llama.cpp` on RHEL 9.4 with CUDA 12.6.

### Create and Activate Conda Environment for `llama.cpp`

```bash
# Create a Conda environment
conda create -n llama-env python=3.12 -y
conda activate llama-env
```

### Install System Dependencies (if needed)

```bash
sudo dnf install -y \
    cmake \
    git \
    gcc \
    gcc-c++ \
    make \
    wget \
    curl \
    unzip \
    libstdc++-devel \
    libffi-devel \
    openssl-devel \
    openblas-devel \
    python3-pip \
    python3-venv \
    elfutils-libelf-devel
```

### Configure and Check CUDA


Verify if CUDA is installed:

```bash
nvidia-smi
```

If CUDA is not in the PATH, add it manually:

```bash
export PATH=/usr/local/cuda/bin:$PATH
export CUDA_HOME=/usr/local/cuda
export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH
```

To make these settings permanent, add them to `~/.bashrc`:

```bash
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export CUDA_HOME=/usr/local/cuda' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

Check the CUDA compiler:

```bash
which nvcc
nvcc --version
```

### Clone and Build `llama.cpp`

```bash
# Clone the official repository
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Create a build directory
mkdir build && cd build

# Configure CMake with CUDA support (example for architecture 90)
cmake .. -DGGML_CUDA=ON -DGGML_CUBLAS=ON -DCMAKE_CUDA_ARCHITECTURES="90" \
-DGGML_CUDA_FORCE_MMQ=ON -DGGML_CPU_AARCH64=OFF -DGGML_NATIVE=OFF

# Build the code (Release)
cmake --build . --config Release -j $(nproc)
```

Verify if the GPU was recognized:

```bash
grep -i "CUDA" CMakeCache.txt
```

*The output should indicate `GGML_CUDA:BOOL=ON`.*

### Test Execution with GPU

```bash
./bin/llama-cli \
    --model "/path/to/your/model.gguf" \
    --threads 32 \
    --threads-batch 32 \
    --ctx-size 8192 \
    --temp 0.6 \
    --n-gpu-layers 62 \
    --split-mode layer \
    --prompt "<|User|> Testing if the model is running on the GPU. <|Assistant|>"
```

---

## Model Download Scripts (`model/`)

The `model/` folder contains example scripts to facilitate **selective downloading of GGUF-format models** hosted on Hugging Face. This is useful for downloading only the necessary files from a specific subfolder (e.g., quantizations like `Q4_K_M`, `UD-Q2_K_XL`, etc.), avoiding downloading the entire repository.

One of the included scripts is:

```bash
v3-0324.py
```

This script performs:

- Listing of files in the specified repository;
- Filtering of files that belong to a subfolder (e.g., `UD-Q2_K_XL`);
- Automatic creation of the local directory structure;
- Copying of downloaded files from the Hugging Face cache to the final destination.

> ⚠️ Edit the parameters at the end of the script to specify:
>
> - The desired `repo_id`;
> - The subfolder to download;
> - The desired local directory structure.

This script can be easily adapted for different versions or quantizations of DeepSeek models or other models compatible with `llama.cpp`.

## Distributed Execution with `server` Scripts

The `server/` folder contains the base script used to initialize `llama-server` instances across multiple nodes. Instead of maintaining multiple nearly identical files, it is recommended to use a **single central script** called:

```bash
carcara_v3_server.sh
```

This script is responsible for:

- Checking CUDA and memory environment;
- Downloading the model and tokenizer, if needed;
- Configuring execution parameters;
- Launching `llama-server` with multi-GPU support, including the HTTP API.

### How to Use for Multiple Nodes

We suggest that you **create a copy of the script** for each node in your infrastructure, naming the files clearly. For example:

```bash
cp carcara_v3_server.sh carcara_v3_server_node1.sh
cp carcara_v3_server.sh carcara_v3_server_node2.sh
# ...
```

Each copy should then be **customized** with:

- Number of GPUs and available VRAM;
- Specific paths for the model (`MODEL_DIR`) and tokenizer (`TOKENIZER_PATH`);
- API port (`--port` in the `llama-server` command);
- Unique **API key** for the node.

> ⚠️ **Important:**  
> The line containing the API key in the script is:
> ```bash
> --api-key <ADD_API_HERE>
> ```
> Replace this placeholder with the actual API key used by that node.

> 🧠 **Remember:**  
> All these settings should be updated directly in the `main()` block of the `carcara_v3_server_nodeN.sh` script, according to the corresponding node.

Additionally, check if the path to the `llama-server` executable is correct. In the provided example:

```bash
LLAMA_CLI="/scratch/dockvs/leon.costa/src/llama.cpp/build/bin/llama-cli"
```

And execution is done with:

```bash
./src/llama.cpp/build/bin/llama-server
```

Adapt these paths to your local structure.

---

## Orchestration with Ray Serve (`chat_router`)

The `ray/` folder contains the `chat_router.py` script, responsible for intelligent request routing between different nodes via API. This router acts as a **central dispatcher**, balancing the load between `llama-server` servers based on conversation history, each node’s context limit, and resource availability.

### Node Configuration with `.env`

Before starting the router, you need to create a `.env` file in the project root defining each node’s parameters. This file should contain:

- The context limit for each server (`NODE{i}_MAX_CONTEXT`);
- The HTTP endpoint of each API (`NODE{i}_ENDPOINT`);
- The API authentication key, if used (`NODE{i}_API_KEY`).

Example configuration for 4 nodes:

```env
# .env

# Maximum tokens per context
NODE1_MAX_CONTEXT=8192
NODE2_MAX_CONTEXT=8192
NODE3_MAX_CONTEXT=8192
NODE4_MAX_CONTEXT=8192

# HTTP Endpoints of each node's API
NODE1_ENDPOINT=http://localhost:PORT_A/v1/chat/completions
NODE2_ENDPOINT=http://localhost:PORT_B/v1/chat/completions
NODE3_ENDPOINT=http://localhost:PORT_C/v1/chat/completions
NODE4_ENDPOINT=http://localhost:PORT_D/v1/chat/completions

# Authentication keys (if any)
NODE1_API_KEY=
NODE2_API_KEY=
NODE3_API_KEY=
NODE4_API_KEY=
```

> 💡 This `.env` file will be automatically read by the `chat_router.py` script to configure the available nodes in the inference cluster.

### Running the Router

After configuring the `.env` and ensuring all `llama-server` instances are running, launch the router with:

```bash
serve run chat_router:app
```

This command initializes Ray Serve and activates smart request routing. The router is responsible for:

- Detecting which node has the best response capacity;
- Maintaining message history and conversation context per user;
- Splitting processing between nodes based on token usage and remaining context;
- Redirecting the request to the appropriate endpoint with the corresponding API key (if needed).

---


## Web Interface (`webui/`)

The `webui/` folder contains a modern frontend application (built with Vite + TailwindCSS), adapted from `llama.cpp` for our use case, that communicates with the orchestrator (`chat_router`) to provide a chat interface for interacting with the local LLM.

### Running in Development Mode

Enter the `webui/` folder:

```bash
cd webui
```

Install dependencies:

```bash
npm install
```

Start the development server (accessible via network):

```bash
npm run dev -- --host=0.0.0.0
```

> The interface will be accessible at `http://<host>:5173`.

---

### Running in Production Mode

Still inside the `webui/` folder:

#### 1. Install dependencies (if not done yet):

```bash
npm install
```

#### 2. Build the application:

```bash
npm run build
```

> This will generate static files inside the `dist/` folder.

#### 3. Serve the static files (using `serve`):

Install the package globally:

```bash
npm install -g serve
```

Then serve the build output:

```bash
serve -s dist -l 3000
```

> The application will be served at `http://<host>:3000`.

---


## Final Considerations

- **API Access:**  
  SSH tunnels allow you to access the API remotely. Make sure the required ports are open and properly configured.
- **`llama.cpp` Compilation:**  
  Follow the steps carefully to ensure CUDA support is enabled and the GPU is correctly recognized.

Follow these steps to reproduce the results and adjust the configuration as needed for your specific environment. If in doubt, consult the official documentation for [llama.cpp](https://github.com/ggerganov/llama.cpp).
