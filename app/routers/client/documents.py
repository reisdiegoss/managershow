"""
Manager Show — Router: Documents (Motor de Documentos Dinâmico)
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.permissions import require_permissions
from app.core.tenant_filter import tenant_query
from app.models.document_template import DocumentEntityType, DocumentTemplate
from app.models.show import Show
from app.models.artist import Artist
from app.models.contractor import Contractor
from app.schemas.document import (
    DocumentGenerateRequest,
    DocumentTemplateCreate,
    DocumentTemplateResponse,
    DocumentTemplateUpdate,
)
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/documents", tags=["Client — Motor de Documentos"])


@router.post("/templates", response_model=DocumentTemplateResponse, status_code=201)
async def create_template(
    payload: DocumentTemplateCreate,
    db: DbSession,
    tenant_id: TenantId,
    current_user: Any = Depends(require_permissions("can_manage_daysheet")), # Permissão aproximada
) -> DocumentTemplate:
    """Cria um novo template de documento para o tenant."""
    template = DocumentTemplate(
        tenant_id=tenant_id,
        **payload.model_dump(),
    )
    db.add(template)
    await db.flush()
    await db.refresh(template)
    return template


@router.get("/templates", response_model=list[DocumentTemplateResponse])
async def list_templates(
    db: DbSession,
    tenant_id: TenantId,
    entity_type: DocumentEntityType | None = None,
) -> list[DocumentTemplate]:
    """Lista templates do tenant, opcionalmente filtrados por tipo de entidade."""
    stmt = tenant_query(DocumentTemplate, tenant_id)
    if entity_type:
        stmt = stmt.where(DocumentTemplate.entity_type == entity_type)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.put("/templates/{template_id}", response_model=DocumentTemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    payload: DocumentTemplateUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> DocumentTemplate:
    """Atualiza um template existente."""
    stmt = tenant_query(DocumentTemplate, tenant_id).where(DocumentTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
    
    await db.flush()
    await db.refresh(template)
    return template


@router.delete("/templates/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
):
    """Remove um template."""
    stmt = tenant_query(DocumentTemplate, tenant_id).where(DocumentTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado.")
    
    await db.delete(template)
    await db.flush()


@router.post("/templates/{template_id}/generate")
async def generate_dynamic_document(
    template_id: uuid.UUID,
    payload: DocumentGenerateRequest,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    Geração Dinâmica de PDF: Busca o template, injeta o objeto de domínio e as
    variáveis customizadas, e retorna o PDF resultante.
    """
    # 1. Busca o template
    stmt_tpl = tenant_query(DocumentTemplate, tenant_id).where(DocumentTemplate.id == template_id)
    tpl_result = await db.execute(stmt_tpl)
    template = tpl_result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado.")

    context = {**payload.custom_variables}

    # 2. Busca a entidade principal com base no entity_type
    if template.entity_type == DocumentEntityType.SHOW:
        # Carrega Show com relacionamentos essenciais para propostas/contratos
        stmt_show = (
            tenant_query(Show, tenant_id)
            .options(
                selectinload(Show.artist),
                selectinload(Show.venue),
                selectinload(Show.contractor)
            )
            .where(Show.id == payload.entity_id)
        )
        show_res = await db.execute(stmt_show)
        show = show_res.scalar_one_or_none()
        if not show:
            raise HTTPException(status_code=404, detail="Show não encontrado.")
        context["show"] = show

    elif template.entity_type == DocumentEntityType.ARTIST:
        stmt_art = tenant_query(Artist, tenant_id).where(Artist.id == payload.entity_id)
        art_res = await db.execute(stmt_art)
        artist = art_res.scalar_one_or_none()
        if not artist:
            raise HTTPException(status_code=404, detail="Artista não encontrado.")
        context["artist"] = artist

    elif template.entity_type == DocumentEntityType.CONTRACTOR:
        stmt_cnt = tenant_query(Contractor, tenant_id).where(Contractor.id == payload.entity_id)
        cnt_res = await db.execute(stmt_cnt)
        contractor = cnt_res.scalar_one_or_none()
        if not contractor:
            raise HTTPException(status_code=404, detail="Contratante não encontrado.")
        context["contractor"] = contractor

    # 3. Renderiza e retorna o PDF
    # PT-BR: O Jinja2 renderiza o HTML e injeta os objetos dinamicamente conforme o contexto montado.
    pdf_io = await PDFService.generate_pdf_from_string(template.content_html, context)

    filename = f"{template.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return Response(
        content=pdf_io.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
