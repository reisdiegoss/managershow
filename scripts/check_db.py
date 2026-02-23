"""Verifica contagem de registros nas tabelas."""
from sqlalchemy import create_engine, text
from app.config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url_sync)

tables = [
    "tenants", "users", "roles", "artists", "shows",
    "contractors", "venues", "financial_transactions",
    "commissions", "contracts", "logistics_timeline",
    "city_base_costs", "show_checkins",
]

with engine.connect() as conn:
    print("\n=== Contagem de Registros ===")
    for t in tables:
        count = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        print(f"  {t}: {count}")
    print()
