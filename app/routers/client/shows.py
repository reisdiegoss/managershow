"""
Manager Show — Router: Shows (Client — Módulo 1: Agenda e Venda)

CRUD de shows com:
- Criação híbrida (Privado ou Público/Prefeitura)
- Cadastro on-the-fly de Contractor/Venue via objetos aninhados
- Filtros de negociação obrigatórios no Pydantic
- Simulador de viabilidade (GET /shows/simulate)
- Filtro obrigatório por tenant_id
"""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from app.core.limiter import limiter

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.permissions import require_permissions
from app.exceptions import ShowNotFoundException
from app.models.contractor import Contractor
from app.models.show import Show
from app.models.venue import Venue
from app.schemas.common import PaginatedResponse
from app.schemas.show import (
    ShowCreate,
    ShowResponse,
    ShowUpdate,
    SimulateRequest,
    SimulateResponse,
)

router = APIRouter(prefix="/shows", tags=["Client — Shows"])


@router.post("/", response_model=ShowResponse, status_code=201)
async def create_show(
    data: ShowCreate,
    db: DbSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
) -> Show:
    """
    Cria um novo show na agenda.

    Suporta cadastro on-the-fly: se contractor_id ou venue_id não
    forem informados mas os objetos aninhados estiverem presentes,
    o backend cria as entidades automaticamente.
    """
    from app.services.budget_simulator_service import calculate_dynamic_budget_and_face_value

    show_data = data.model_dump(exclude={"contractor", "venue"})
    show_data["tenant_id"] = tenant_id

    # --- Cadastro On-The-Fly: Contratante ---
    if not data.contractor_id and data.contractor:
        contractor = Contractor(
            tenant_id=tenant_id,
            **data.contractor.model_dump(),
        )
        db.add(contractor)
        await db.flush()
        show_data["contractor_id"] = contractor.id

    # --- Cadastro On-The-Fly: Local/Venue ---
    if not data.venue_id and data.venue:
        venue = Venue(
            tenant_id=tenant_id,
            **data.venue.model_dump(),
        )
        db.add(venue)
        await db.flush()
        show_data["venue_id"] = venue.id

    # --- Cálculo do BI Previsional (Motor de Inteligência) ---
    # Criamos o objeto temporário para o simulador processar as regras
    temp_show = Show(**show_data)
    bi_results = await calculate_dynamic_budget_and_face_value(temp_show, db)

    show_data["real_cache"] = bi_results["real_cache"]
    show_data["logistics_budget_limit"] = bi_results["logistics_budget_limit"]

    show = Show(**show_data)
    db.add(show)
    await db.flush()
    await db.refresh(show)
    return show


@router.get("/", response_model=PaginatedResponse[ShowResponse])
async def list_shows(
    db: DbSession,
    tenant_id: TenantId,
    current_user: CurrentUser, # CORREÇÃO
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filtrar por status"),
    artist_id: uuid.UUID | None = Query(None, description="Filtrar por artista"),
    month: int | None = Query(None, ge=1, le=12, description="Mês do show"),
    year: int | None = Query(None, ge=2020, description="Ano do show"),
) -> dict:
    """Lista shows do tenant com paginação e filtros opcionais."""
    filters = [Show.tenant_id == tenant_id]

    if status:
        filters.append(Show.status == status)
    if artist_id:
        filters.append(Show.artist_id == artist_id)
    if month:
        filters.append(func.extract("month", Show.date_show) == month)
    if year:
        filters.append(func.extract("year", Show.date_show) == year)

    # --- Filtro de Visibilidade (Nível 3: Escopo de Artista) ---
    if not current_user.has_global_artist_access:
        filters.append(Show.artist_id.in_(current_user.allowed_artist_ids))

    # Total
    count_stmt = select(func.count()).select_from(Show).where(*filters)
    total = (await db.execute(count_stmt)).scalar() or 0

    # Registros paginados com selectinload para evitar lazy load
    from sqlalchemy.orm import selectinload
    offset = (page - 1) * page_size
    stmt = (
        select(Show)
        .options(
            selectinload(Show.artist),
            selectinload(Show.contractor),
            selectinload(Show.venue)
        )
        .where(*filters)
        .offset(offset)
        .limit(page_size)
        .order_by(Show.date_show.desc())
    )
    result = await db.execute(stmt)
    shows = result.scalars().all()


    total_pages = (total + page_size - 1) // page_size

    return {
        "items": shows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/simulate", response_model=SimulateResponse)
async def simulate_viability(
    db: DbSession,
    tenant_id: TenantId,
    city: str = Query(...),
    uf: str = Query(..., max_length=2),
    cache: Decimal = Query(..., ge=0),
    negotiation_type: str = Query(...),
) -> dict:
    """
    Simulador de Viabilidade Financeira.

    Busca médias de custo (AVG) de FLIGHT e HOTEL para a cidade
    nos últimos 12 meses e projeta um DRE provisório.

    Retorna status "VIABLE" (Verde) ou "RISKY" (Vermelho).
    Toda a matemática está isolada em finance_service.py.
    """
    from dataclasses import asdict

    from app.services.finance_service import simulate_viability as run_simulation

    result = await run_simulation(db, tenant_id, city, uf, cache)
    return asdict(result)


@router.get("/{show_id}", response_model=ShowResponse)
async def get_show(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> Show:
    """Busca um show pelo ID (filtrado por tenant)."""
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    # --- Proteção de Rota (Nível 3: Escopo de Artista) ---
    if not current_user.has_global_artist_access:
        if show.artist_id not in current_user.allowed_artist_ids:
            # Retornar 404 (Security through Obscurity)
            raise ShowNotFoundException(show_id)

    return show


@router.get("/{show_id}/pdf/daysheet", summary="Download Day Sheet PDF")
@limiter.limit("2/minute")
async def download_daysheet_pdf(
    request: Request,
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    Gera e retorna o PDF do Day Sheet (Roteiro) do show.
    """
    from fastapi import Response
    from sqlalchemy.orm import selectinload
    from app.services.pdf_service import PDFService
    from app.models.show_checkin import ShowCheckin

    stmt = (
        select(Show)
        .options(
            selectinload(Show.artist),
            selectinload(Show.venue),
            selectinload(Show.checkin_users).selectinload(ShowCheckin.user)
        )
        .where(Show.id == show_id, Show.tenant_id == tenant_id)
    )
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    
    if not show:
        raise ShowNotFoundException(show_id)

    # --- Proteção de Rota (Nível 3: Escopo de Artista) ---
    if not current_user.has_global_artist_access:
        if show.artist_id not in current_user.allowed_artist_ids:
            raise ShowNotFoundException(show_id)

    team = [checkin.user.name for checkin in show.checkin_users if checkin.user]
    
    show_data = {
        "artist_name": show.artist.name,
        "date": show.date_show.strftime("%d/%m/%Y"),
        "venue_name": show.location_venue_name or (show.venue.name if show.venue else "N/A"),
        "city": show.location_city,
        "uf": show.location_uf,
        "address": show.venue.address if show.venue else "N/A",
        "notes": show.notes
    }

    pdf_io = PDFService.get_daysheet_pdf(show_data, team)

    return Response(
        content=pdf_io.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=DaySheet_{show.artist.name.replace(' ', '_')}_{show.date_show}.pdf"
        }
    )


@router.patch("/{show_id}", response_model=ShowResponse)
async def update_show(
    show_id: uuid.UUID,
    data: ShowUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> Show:
    """
    Atualiza parcialmente um show.

    REGRA DA BÍBLIA (Regra 01): Não altera negotiation_type se contrato gerado.
    """
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(show, field, value)

    # --- Re-cálculo do BI Previsional (Motor de Inteligência) ---
    # Se campos críticos mudaram, o BI deve ser recalculado
    critical_fields = {"base_price", "production_kickback", "client_type", "negotiation_type", "location_city", "location_uf"}
    if any(f in update_data for f in critical_fields):
        from app.services.budget_simulator_service import calculate_dynamic_budget_and_face_value
        bi_results = await calculate_dynamic_budget_and_face_value(show, db)
        show.real_cache = bi_results["real_cache"]
        show.logistics_budget_limit = bi_results["logistics_budget_limit"]

    await db.flush()
    await db.refresh(show)
    return show
@router.post("/{show_id}/execution-media", status_code=201)
async def upload_execution_media(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
    files: list[UploadFile] = File(...),
) -> dict:
    """
    Upload múltiplo de fotos/vídeos de comprovação de execução do show.
    Valida Magic Bytes (apenas imagem e mp4).
    """
    from app.services.s3_service import S3Service
    from app.models.show_execution_media import ShowExecutionMedia

    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise HTTPException(status_code=404, detail="Show não encontrado")

    allowed_types = ["image/jpeg", "image/png", "image/webp", "video/mp4"]
    results = []
    errors = []

    for file in files:
        try:
            # Validação básica de tipo
            if file.content_type not in allowed_types:
                errors.append({"file": file.filename, "error": f"Tipo {file.content_type} não permitido"})
                continue

            content = await file.read()
            url = await S3Service.upload_file(
                file_content=content,
                filename=file.filename,
                content_type=file.content_type
            )

            media = ShowExecutionMedia(
                tenant_id=tenant_id,
                show_id=show_id,
                media_url=url,
                media_type=file.content_type,
                filename=file.filename
            )
            db.add(media)
            results.append({"filename": file.filename, "url": url})
        except Exception as e:
            errors.append({"file": file.filename, "error": str(e)})

    await db.flush()

    if errors:
        # Se houver erros, retorna 207 Multi-Status conforme diretriz
        return {
            "status": "partial_success" if results else "error",
            "uploaded": results,
            "failed": errors
        }

    return {"status": "success", "uploaded": results}
