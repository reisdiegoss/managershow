"""
Manager Show — Filtro Global Multi-Tenant (SQLAlchemy)

Garante que TODA query filtre obrigatoriamente por tenant_id.

Dois mecanismos de segurança:
1. TenantRepository: Classe base que injeta tenant_id em todas
   as operações CRUD (select, insert, update, delete).
2. tenant_query(): Helper que retorna um select() já filtrado
   por tenant_id — para uso rápido nos routers/services.

REGRA DA ARCHITECTURE.md: Uma produtora NUNCA pode ver ou alterar
dados de outra. Este módulo é a implementação dessa garantia.
"""

import uuid
from typing import TypeVar

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

T = TypeVar("T", bound=Base)


def tenant_query(
    model: type[T],
    tenant_id: uuid.UUID,
) -> Select:
    """
    Retorna um select() já filtrado por tenant_id.

    Uso rápido nos services/routers:
        stmt = tenant_query(Show, tenant_id).where(Show.status == "SONDAGEM")
        result = await db.execute(stmt)

    Equivalente a:
        select(Show).where(Show.tenant_id == tenant_id)

    MAS com a diferença que o filtro NUNCA é esquecido.
    """
    return select(model).where(model.tenant_id == tenant_id)


class TenantRepository:
    """
    Repositório base com filtro Multi-Tenant obrigatório.

    Todo repositório que acessa entidades multi-tenant DEVE
    herdar desta classe. O tenant_id é injetado automaticamente
    em todas as operações.

    Exemplo de uso:
        class ShowRepository(TenantRepository):
            def __init__(self, db: AsyncSession, tenant_id: uuid.UUID):
                super().__init__(db, tenant_id, Show)

            async def find_by_status(self, status: str):
                stmt = self.base_query().where(Show.status == status)
                result = await self.db.execute(stmt)
                return result.scalars().all()
    """

    def __init__(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        model: type[T],
    ):
        self.db = db
        self.tenant_id = tenant_id
        self.model = model

    def base_query(self) -> Select:
        """Retorna select() filtrado pelo tenant_id da sessão."""
        return select(self.model).where(self.model.tenant_id == self.tenant_id)

    async def get_by_id(self, entity_id: uuid.UUID) -> T | None:
        """Busca entidade por ID + tenant_id (isolamento garantido)."""
        stmt = self.base_query().where(self.model.id == entity_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        offset: int = 0,
        limit: int = 20,
        order_by=None,
    ) -> list[T]:
        """Lista entidades do tenant com paginação."""
        stmt = self.base_query()
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        stmt = stmt.offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        """Conta total de entidades do tenant."""
        from sqlalchemy import func
        stmt = select(func.count()).select_from(self.model).where(
            self.model.tenant_id == self.tenant_id
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def create(self, entity: T) -> T:
        """Cria entidade forçando o tenant_id correto."""
        entity.tenant_id = self.tenant_id
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def update(self, entity_id: uuid.UUID, data: dict) -> T | None:
        """Atualiza entidade por ID + tenant_id (parcial)."""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return None
        for field, value in data.items():
            setattr(entity, field, value)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def delete(self, entity_id: uuid.UUID) -> bool:
        """Remove entidade por ID + tenant_id."""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False
        await self.db.delete(entity)
        await self.db.flush()
        return True
