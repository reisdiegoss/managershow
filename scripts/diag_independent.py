import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    database_url = os.getenv("DATABASE_URL")
    # Convert sqlalchemy url to asyncpg
    if database_url.startswith("postgresql+asyncpg://"):
        url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    else:
        url = database_url

    conn = await asyncpg.connect(url)
    try:
        rows = await conn.fetch(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'financial_transactions' ORDER BY ordinal_position"
        )
        for row in rows:
            print(f"COL: {row['column_name']} | TYPE: {row['data_type']}")
        # Verificar Enums
        print("\nChecking Enum Types:")
        types = await conn.fetch(
            "SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e'"
        )
        for t in types:
            print(f"TYPE: {t['typname']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run())
