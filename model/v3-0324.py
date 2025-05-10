import os
import shutil
from huggingface_hub import hf_hub_download, list_repo_files

def baixar_subpasta(repo_id: str, subpasta_origem: str, pasta_principal_destino: str, nome_modelo_destino: str, destino: str = ".") -> None:
    """
    Baixa apenas os arquivos da subpasta especificada do repositório do Hugging Face.
    
    Args:
        repo_id (str): ID do repositório (ex: "unsloth/DeepSeek-V3-0324-GGUF").
        subpasta_origem (str): Nome da subpasta no repositório que contém o modelo (ex: "Q4_K_M").
        pasta_principal_destino (str): Nome da pasta principal a ser criada no destino (ex: "DeepSeek-V3-0324-GGUF").
        nome_modelo_destino (str): Nome da subpasta onde os arquivos serão salvos (ex: "DeepSeek-V3-0324-Q4_K_M").
        destino (str): Diretório base onde as pastas serão criadas (default: diretório atual).
    """
    try:
        # Cria a estrutura de diretórios de destino
        destino_pasta_principal = os.path.join(destino, pasta_principal_destino)
        destino_modelo = os.path.join(destino_pasta_principal, nome_modelo_destino)
        os.makedirs(destino_modelo, exist_ok=True)
        
        print("Listando arquivos do repositório...")
        arquivos = list_repo_files(repo_id=repo_id, revision="main")
        
        # Filtra os arquivos que estão na subpasta desejada
        arquivos_subpasta = [f for f in arquivos if f.startswith(subpasta_origem + "/")]
        
        if not arquivos_subpasta:
            raise FileNotFoundError(f"Nenhum arquivo encontrado na subpasta '{subpasta_origem}' do repositório.")
        
        for arquivo in arquivos_subpasta:
            # Remove o prefixo da subpasta para obter o caminho relativo
            relative_path = arquivo[len(subpasta_origem)+1:]  # remove "Q4_K_M/"
            destino_arquivo = os.path.join(destino_modelo, relative_path)
            os.makedirs(os.path.dirname(destino_arquivo), exist_ok=True)
            print(f"Baixando {arquivo}...")
            # Baixa o arquivo (ele é armazenado no cache do huggingface_hub)
            caminho_cache = hf_hub_download(repo_id=repo_id, filename=arquivo, revision="main")
            # Copia o arquivo do cache para o destino desejado
            shutil.copy(caminho_cache, destino_arquivo)
            print(f"Arquivo salvo em: {destino_arquivo}")
        
        print(f"Todos os arquivos da subpasta '{subpasta_origem}' foram baixados com sucesso!")
    except Exception as e:
        print(f"Ocorreu um erro ao baixar a subpasta: {e}")

if __name__ == '__main__':
    # Parâmetros do repositório e destino
    repo_id = "unsloth/DeepSeek-V3-0324-GGUF"
    subpasta_origem = "UD-Q2_K_XL"
    pasta_principal_destino = "DeepSeek-V3-0324-GGUF"
    nome_modelo_destino = "DeepSeek-V3-0324-UD-Q2_K_XL"
    destino = "."
    
    baixar_subpasta(repo_id, subpasta_origem, pasta_principal_destino, nome_modelo_destino, destino)
