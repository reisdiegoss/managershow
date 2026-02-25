"""
Manager Show — Router: Contracts (Client — Módulo 2: Contratos e Trava)

TRAVA MESTRA (Regra 02): POST /validate seta contract_validated = True.
Sem isso, Etapa 3 (Logistics) fica bloqueada.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.permissions import require_permissions
from app.core.tenant_filter import tenant_query
from app.exceptions import ShowNotFoundException
from app.models.contract import Contract, ContractStatus
from app.models.show import Show, ShowStatus
from app.models.user import User
from app.schemas.contract import (
    AvailabilityDeclarationRequest,
    CommercialProposalRequest,
    ContractCreate,
    ContractResponse,
)

router = APIRouter(prefix="/shows/{show_id}/documents", tags=["Client — Documentos Licitatórios"])


@router.post("/", summary="Create Contract", response_model=ContractResponse, status_code=201)
async def create_contract(
    show_id: uuid.UUID,
    payload: ContractCreate,
    db: DbSession,
    tenant_id: TenantId,
) -> Contract:
    """Cria uma minuta de contrato para o show."""
    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    contract = Contract(
        tenant_id=tenant_id,
        show_id=show_id,
        status=ContractStatus.DRAFT,
        **payload.model_dump(),
    )
    db.add(contract)

    # Atualizar status do show
    if show.status.value in ("SONDAGEM", "PROPOSTA"):
        show.status = ShowStatus.CONTRATO_PENDENTE

    await db.flush()
    await db.refresh(contract)
    return contract


@router.get("/", summary="List Contracts", response_model=list[ContractResponse])
async def list_contracts(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> list[Contract]:
    """Lista contratos de um show."""
    stmt = tenant_query(Contract, tenant_id).where(Contract.show_id == show_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/validate", summary="Validate Contract (Trava Mestra)", status_code=200)
async def validate_contract(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: User = Depends(require_permissions("can_approve_contracts")),
) -> dict:
    """
    TRAVA MESTRA — Valida o contrato e libera a Etapa 3.

    Seta contract_validated = True, destravando lançamento de despesas.
    O status do show progride para ASSINADO.
    """
    tenant_id = current_user.tenant_id

    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # 1. Auditoria e Flags
    show.contract_validated = True
    show.contract_validated_at = datetime.now(timezone.utc)
    show.contract_validated_by = current_user.id
    
    # 2. Máquina de Estados
    # REGRA: O show só progride se estiver em fases anteriores à assinatura.
    if show.status in (ShowStatus.SONDAGEM, ShowStatus.PROPOSTA, ShowStatus.CONTRATO_PENDENTE):
        show.status = ShowStatus.ASSINADO

    # 3. Atualizar contratos vinculados (se houver algum assinado recentemente)
    contract_stmt = tenant_query(Contract, tenant_id).where(
        Contract.show_id == show_id,
        Contract.status == ContractStatus.SENT
    )
    contract_result = await db.execute(contract_stmt)
    contracts = contract_result.scalars().all()
    for contract in contracts:
        contract.status = ContractStatus.SIGNED

    await db.flush()

    return {
        "show_id": str(show_id),
        "contract_validated": True,
        "new_status": show.status.value,
        "validated_by": current_user.name,
        "validated_at": show.contract_validated_at.isoformat(),
        "message": "Contrato validado! Etapa 3 (Pré-Produção/Logística) desbloqueada.",
    }


@router.get("/pdf", summary="Download Contract PDF")
async def download_contract_pdf(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    Gera e retorna o PDF da minuta do contrato.
    """
    from fastapi import Response
    from sqlalchemy.orm import selectinload
    from app.services.pdf_service import PDFService

    stmt = (
        tenant_query(Show, tenant_id)
        .options(selectinload(Show.artist), selectinload(Show.contractor), selectinload(Show.venue))
        .where(Show.id == show_id)
    )
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    
    if not show:
        raise ShowNotFoundException(show_id)

    show_data = {
        "show_id": str(show.id),
        "artist_name": show.artist.name,
        "contractor_name": show.contractor.name if show.contractor else "N/A",
        "date": show.date_show.strftime("%d/%m/%Y"),
        "venue_name": show.location_venue_name or (show.venue.name if show.venue else "N/A"),
        "city": show.location_city,
        "uf": show.location_uf,
        "price": f"{show.base_price:,.2f}"
    }

    pdf_io = PDFService.get_contract_pdf(show_data)

    return Response(
        content=pdf_io.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Contrato_{show.artist.name.replace(' ', '_')}_{show.date_show}.pdf"
        }
    )


@router.post("/availability", summary="Generate Availability Declaration")
async def generate_availability_document(
    show_id: uuid.UUID,
    payload: AvailabilityDeclarationRequest,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    Gera a Declaração de Disponibilidade para o show.
    """
    from fastapi import Response
    from sqlalchemy.orm import selectinload
    from app.services.pdf_service import PDFService

    stmt = (
        tenant_query(Show, tenant_id)
        .options(selectinload(Show.artist))
        .where(Show.id == show_id)
    )
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    context = {
        **payload.model_dump(),
        "artist_name": show.artist.name,
        "city": show.location_city,
        "uf": show.location_uf,
    }

    pdf_io = PDFService.get_availability_pdf(context)

    return Response(
        content=pdf_io.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Declaracao_Disponibilidade_{show.artist.name.replace(' ', '_')}.pdf"
        }
    )


@router.post("/proposal", summary="Generate Commercial Proposal")
async def generate_commercial_proposal(
    show_id: uuid.UUID,
    payload: CommercialProposalRequest,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    Gera a Carta Proposta Comercial estruturada para Prefeituras.
    """
    from fastapi import Response
    from sqlalchemy.orm import selectinload
    from app.services.pdf_service import PDFService

    stmt = (
        tenant_query(Show, tenant_id)
        .options(selectinload(Show.artist))
        .where(Show.id == show_id)
    )
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    context = {
        **payload.model_dump(),
        "artist_name": show.artist.name,
        "city": show.location_city,
        "uf": show.location_uf,
        # Dados da produtora podem ser pegos do tenant se necessário
        "requesting_company_name": "GOLDEN EVENTOS", # Default ou vindo do tenant futuramente
    }

    pdf_io = PDFService.get_proposal_pdf(context)

    return Response(
        content=pdf_io.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Carta_Proposta_{show.artist.name.replace(' ', '_')}.pdf"
        }
    )
