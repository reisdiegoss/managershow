"""
Manager Show — Service: FinancialParserService
Implementa a Fase 16: Parser Financeiro Inteligente.

Este serviço traduz as respostas textuais do JSONB do check-in (ex: "DOBRADO", "MAIS_MEIA")
em lançamentos contábeis reais no DRE, consultando o ArtistCrew base.
"""

import uuid
import logging
from decimal import Decimal
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial_transaction import FinancialTransaction, TransactionType, TransactionCategory
from app.models.artist_crew import ArtistCrew
from app.models.show_checkin import ShowCheckin

logger = logging.getLogger(__name__)

# Regras de Negócio — Multiplicadores de Cachê e Diária
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
    "SEM_DIARIA": Decimal("0.0")
}

class FinancialParserService:
    @staticmethod
    async def sync_crew_financials(
        show_id: uuid.UUID,
        tenant_id: uuid.UUID,
        db: AsyncSession
    ):
        """
        Lê o check-in do show e sincroniza o financeiro.
        Mantém a idempotência deletando registros automáticos anteriores.
        """
        try:
            logger.info(f"Iniciando parser financeiro para o show {show_id}")

            # 1. Limpeza de Idempotência: Deleta transações automáticas anteriores deste show
            stmt_delete = delete(FinancialTransaction).where(
                FinancialTransaction.show_id == show_id,
                FinancialTransaction.tenant_id == tenant_id,
                FinancialTransaction.category == TransactionCategory.CREW_PAYMENT,
                FinancialTransaction.is_auto_generated == True
            )
            await db.execute(stmt_delete)

            # 2. Busca todos os check-ins realizados para este show
            # Nota: O formulário dinâmico está salvo em ShowCheckin.dynamic_data
            stmt_checkins = select(ShowCheckin).where(
                ShowCheckin.show_id == show_id,
                ShowCheckin.tenant_id == tenant_id
            )
            result = await db.execute(stmt_checkins)
            checkins = result.scalars().all()

            if not checkins:
                logger.warning(f"Nenhum check-in encontrado para o show {show_id}. Abortando parser.")
                return

            # 3. Processamento das Transações
            for checkin in checkins:
                data = checkin.dynamic_data
                # Esperamos crew_id (ou id do artista na equipe), cache_type e diaria_type
                crew_id = data.get("crew_id")
                cache_type = data.get("cache_type", "PADRAO")
                diaria_type = data.get("diaria_type", "PADRAO")

                if not crew_id:
                    continue

                # Busca o membro da equipe para obter o cachê base
                stmt_crew = select(ArtistCrew).where(ArtistCrew.id == uuid.UUID(crew_id))
                res_crew = await db.execute(stmt_crew)
                member = res_crew.scalar_one_or_none()

                if not member:
                    logger.error(f"Membro da equipe {crew_id} não encontrado no cadastro base.")
                    continue

                # Cálculos baseados nos multiplicadores
                multiplier_cache = CACHE_MULTIPLIERS.get(cache_type, Decimal("1.0"))
                multiplier_diaria = DIARIA_MULTIPLIERS.get(diaria_type, Decimal("1.0"))

                valor_cache = Decimal(str(member.base_cache)) * multiplier_cache
                valor_diaria = Decimal(str(member.base_diaria)) * multiplier_diaria

                total_membro = valor_cache + valor_diaria

                if total_membro > 0:
                    # Cria a transação financeira
                    transaction = FinancialTransaction(
                        tenant_id=tenant_id,
                        show_id=show_id,
                        type=TransactionType.PRODUCTION_COST,
                        category=TransactionCategory.CREW_PAYMENT,
                        description=f"Pagamento Equipe: {member.name} ({member.role}) - Ref: Check-in Estrada",
                        budgeted_amount=total_membro,
                        realized_amount=total_membro,
                        is_auto_generated=True,
                        notes=f"Calculado automaticamente via Parser: Cachê({cache_type}) + Diária({diaria_type})"
                    )
                    db.add(transaction)

            await db.flush()
            logger.info(f"Parser financeiro concluído com sucesso para o show {show_id}")

        except Exception as e:
            logger.error(f"Falha crítica no Parser Financeiro: {str(e)}")
            # Em caso de erro no parser, não queremos quebrar o fluxo principal, mas avisamos no log
            raise e
