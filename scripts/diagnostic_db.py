import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check_db():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'financial_transactions'"))
        cols = [r[0] for r in res.fetchall()]
        print(f"COLUMNS: {cols}")

if __name__ == "__main__":
    asyncio.run(check_db())
