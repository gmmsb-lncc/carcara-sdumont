# Selective Subfolder Download from Hugging Face

This script performs a **selective download** of a specific subfolder from a repository on Hugging Face, making it easier to locally organize quantized models from the **DeepSeek-V3** family in GGUF format.

---

## Purpose

Avoids downloading the entire repository by downloading **only the files contained in a specific subfolder** (e.g., `UD-Q2_K_XL`, `Q4_K_M`, etc.), which is useful for saving time, disk space, and organizing models locally.

---

## Created Structure

Running the script creates the following directory structure:

```
DeepSeek-V3-0324-GGUF/
└── DeepSeek-V3-0324-UD-Q2_K_XL/
    ├── shard-00001-of-00003.gguf
    ├── shard-00002-of-00003.gguf
    └── shard-00003-of-00003.gguf
```

> The name of the main folder (`DeepSeek-V3-0324-GGUF`) and the target subfolder (`DeepSeek-V3-0324-UD-Q2_K_XL`) can be freely changed via parameters.

---

## Execution

To run the script, simply execute:

```bash
python v3-0324.py
```

---

## Internal Parameters (customizable)

These parameters can be adjusted directly in the `if __name__ == '__main__':` block:

| Parameter                  | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| `repo_id`                 | Hugging Face repository ID (e.g., `"unsloth/DeepSeek-V3-0324-GGUF"`)        |
| `subpasta_origem`         | Name of the subfolder within the repository (e.g., `"UD-Q2_K_XL"`)          |
| `pasta_principal_destino`| Name of the main local folder (e.g., `"DeepSeek-V3-0324-GGUF"`)             |
| `nome_modelo_destino`     | Name of the local subfolder where files will be saved                       |
| `destino`                 | Path where everything will be created (default: `"."`, i.e., current dir)   |

---

## Requirements

Install the required library with:

```bash
pip install huggingface_hub
```

---

## Example of Use with Another Quantization

To download another quantization, such as `"Q4_K_M"`, edit the script:

```python
subpasta_origem = "Q4_K_M"
nome_modelo_destino = "DeepSeek-V3-0324-Q4_K_M"
```

---

## Notes

- Files are downloaded from the Hugging Face cache (`hf_hub_download`) and copied to the destination folder.
- The script **does not download the tokenizer**. If needed, use the `AutoTokenizer` method manually in another script.

---
