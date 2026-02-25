"""
Manager Show — Service: FinancialParserService
Implementa a Fase 16: Parser Financeiro Inteligente e Idempotente.

Traduz respostas do JSONB de check-in em lançamentos contábeis automáticos,
consultando salários-base da ArtistCrew e aplicando multiplicadores de negócio.
"""

import uuid
import logging
from decimal import Decimal
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial_transaction import FinancialTransaction, TransactionType, TransactionCategory
from app.models.artist_crew import ArtistCrew

logger = logging.getLogger(__name__)

# --- Regras de Negócio: Multiplicadores (Diretrizes Invioláveis) ---
CACHE_MULTIPLIERS = {
    "PADRAO": Decimal("1.0"),
    "MEIO": Decimal("0.5"),
    "DOBRADO": Decimal("2.0"),
    "SEM_CACHE": Decimal("0.0"),
    "FALTOU": Decimal("0.0")
}

DIARIA_MULTIPLIERS = {
    "PADRAO": Decimal("1.0"),
    "MAIS_MEIA": Decimal("1.5"),
    "MAIS_UMA": Decimal("2.0"),
    "SEM_DIARIA": Decimal("0.0"),
    "OUTRO": Decimal("1.0") # Mantém base, mas exige justificativa no front
}

class FinancialParserService:
    @staticmethod
    async def sync_crew_financials(
        show_id: uuid.UUID,
        tenant_id: uuid.UUID,
        crew_data: list[dict],
        db: AsyncSession
    ):
        """
        Sincroniza as despesas de equipe no financeiro com base no check-in.
        Garante idempotência limpando lançamentos automáticos anteriores do show.
        """
        try:
            logger.info(f"Iniciando parser financeiro idempotente para show {show_id}")

            # 1. Limpeza Cirúrgica (Idempotência)
            # Remove apenas despesas de equipe geradas automaticamente para este show
            stmt_delete = delete(FinancialTransaction).where(
                FinancialTransaction.show_id == show_id,
                FinancialTransaction.tenant_id == tenant_id,
                FinancialTransaction.category == TransactionCategory.CREW_PAYMENT,
                FinancialTransaction.is_auto_generated == True
            )
            await db.execute(stmt_delete)

            if not crew_data:
                logger.warning(f"Sem dados de equipe para processar no show {show_id}")
                return

            # 2. Busca Otimizada (Performance)
            # Extraímos todos os IDs para uma única query .in_()
            crew_ids = [uuid.UUID(item["crew_id"]) for item in crew_data if "crew_id" in item]
            
            if not crew_ids:
                return

            stmt_base = select(ArtistCrew).where(ArtistCrew.id.in_(crew_ids))
            result = await db.execute(stmt_base)
            crew_base_map = {c.id: c for c in result.scalars().all()}

            # 3. Processamento e Lançamento
            new_transactions = []
            for item in crew_data:
                c_id = uuid.UUID(item["crew_id"])
                crew = crew_base_map.get(c_id)

                if not crew:
                    logger.error(f"Integridade violada: Crew ID {c_id} não encontrado no cadastro.")
                    continue

                # Matemática Oculta
                mult_cache = CACHE_MULTIPLIERS.get(item.get("cache_type"), Decimal("1.0"))
                mult_diaria = DIARIA_MULTIPLIERS.get(item.get("diaria_type"), Decimal("1.0"))

                valor_cache = Decimal(str(crew.base_cache)) * mult_cache
                valor_diaria = Decimal(str(crew.base_diaria)) * mult_diaria
                total_membro = valor_cache + valor_diaria

                if total_membro > 0:
                    description = f"Pagamento Automático: {crew.name} ({crew.role})"
                    transaction = FinancialTransaction(
                        tenant_id=tenant_id,
                        show_id=show_id,
                        type=TransactionType.PRODUCTION_COST,
                        category=TransactionCategory.CREW_PAYMENT,
                        description=description,
                        budgeted_amount=total_membro,
                        realized_amount=total_membro,
                        is_auto_generated=True,
                        notes=f"Calculado: Cache={item.get('cache_type')} | Diaria={item.get('diaria_type')}"
                    )
                    new_transactions.append(transaction)

            if new_transactions:
                db.add_all(new_transactions)
            
            await db.commit()
            logger.info(f"Sucesso: {len(new_transactions)} transações de equipe sincronizadas para o show {show_id}")

        except Exception as e:
            logger.error(f"Erro no FinancialParserService: {str(e)}")
            # Não lançamos o erro para cima para não travar o salvamento do formulário no router
            # mas o log permite auditoria.
            raise e
