import os
import sys
import uuid
import asyncio
import py_compile
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Adiciona o diretório raiz ao PYTHONPATH
sys.path.append(os.getcwd())

async def run_audit(sync_clerk_id: str = None):
    print("=" * 60)
    print("🚀 MANAGER SHOW - AUDITORIA DE SISTEMA E ESTABILIZAÇÃO")
    print("=" * 60)

    # 1. Auditoria de Sintaxe
    print("\n[1/4] Verificando integridade de arquivos Python...")
    errors = 0
    for root, _, files in os.walk("app"):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    py_compile.compile(path, doraise=True)
                except py_compile.PyCompileError as e:
                    print(f"❌ Erro de Sintaxe: {path}\n   -> {e}")
                    errors += 1
    
    if errors == 0:
        print("✅ Todos os arquivos Python estão sintaticamente corretos.")
    else:
        print(f"⚠️ Encontrados {errors} erros de sintaxe.")

    # 2. Auditoria de Ambiente (Base)
    print("\n[2/4] Verificando dependências base...")
    try:
        from app.main import app
        from app.database import engine
        from app.config import get_settings
        print("✅ Core FastAPI e Configurações carregados com sucesso.")
    except Exception as e:
        print(f"❌ Falha ao carregar componentes core: {e}")
        return

    # 3. Auditoria de Banco de Dados e Dados Mestres
    print("\n[3/4] Verificando integridade dos dados mestres...")
    from app.database import async_session_factory
    from app.models.tenant import Tenant, TenantStatus
    from app.models.user import User

    async with async_session_factory() as session:
        try:
            # Verificar Tenant Vima HQ
            stmt = select(Tenant).where(Tenant.name.like("%Vima Sistemas%"))
            vima = (await session.execute(stmt)).scalar_one_or_none()
            if vima:
                print(f"✅ Tenant Vima HQ encontrado: {vima.id}")
            else:
                print("⚠️ ATENÇÃO: Tenant Vima HQ não encontrado!")
            
            # Verificar Usuário Admin
            stmt_user = select(User).where(User.email == "contato@vimasistemas.com.br")
            admin = (await session.execute(stmt_user)).scalar_one_or_none()
            if admin:
                print(f"✅ Usuário Admin encontrado: {admin.email} (Clerk ID: {admin.clerk_id})")
                
                # Sincronização explícita de Clerk ID (O NOVO HEAL)
                if sync_clerk_id:
                    print(f"🔄 Sincronizando Clerk ID para: {sync_clerk_id}...")
                    admin.clerk_id = sync_clerk_id
                    await session.commit()
                    print("✅ Sincronização concluída com sucesso!")
            else:
                print("⚠️ ATENÇÃO: Usuário Admin (contato@vimasistemas.com.br) não encontrado!")

        except Exception as e:
            print(f"❌ Erro ao acessar o banco de dados: {e}")

    # 4. Auditoria de Portas e Conflitos
    print("\n[4/4] Verificando serviços ativos...")
    import socket
    def check_port(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0
    
    if check_port(8000):
        print("⚠️ Porta 8000 (Backend) já está em uso por outro processo.")
    else:
        print("✅ Porta 8000 (Backend) está livre.")

    print("\n" + "=" * 60)
    print("🏁 Auditoria Finalizada.")
    print("=" * 60)

if __name__ == "__main__":
    clerk_id = None
    if "--sync-clerk" in sys.argv:
        idx = sys.argv.index("--sync-clerk")
        if idx + 1 < len(sys.argv):
            clerk_id = sys.argv[idx + 1]
    
    asyncio.run(run_audit(clerk_id))
