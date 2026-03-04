
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Tenta pegar o token do Clerk se disponível ou usar o header de dev
url = "http://localhost:8000/api/v1/retaguarda/tenants"
headers = {
    "X-Dev-User-Id": "00000000-0000-0000-0000-000000000000" # UUID seedado ou superadmin
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total de Tenants: {data.get('total')}")
        if data.get('items'):
            print("Primeiro tenant carregado com sucesso!")
            print(f"Exemplo: {data['items'][0]['name']} - Suspenso: {data['items'][0]['is_suspended']}")
    else:
        print(f"Erro: {response.text}")
except Exception as e:
    print(f"Falha na conexão: {e}")
