from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import DbSession, CurrentUser
from app.core.tenant_filter import tenant_query
from app.models.form_template import FormTemplate
from app.schemas.form_template import FormTemplateCreate, FormTemplateUpdate, FormTemplateResponse

router = APIRouter(prefix="/settings/form-templates", tags=["Client — Configurações de Formulários"])

@router.get("/", response_model=list[FormTemplateResponse])
async def list_form_templates(
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Lista todos os templates de formulários dinâmicos do tenant.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(FormTemplate, tenant_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=FormTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_form_template(
    template_in: FormTemplateCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Cria um novo template de formulário para ser usado em processos operacionais.
    """
    template = FormTemplate(
        **template_in.model_dump(),
        tenant_id=current_user.tenant_id
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template

@router.patch("/{template_id}", response_model=FormTemplateResponse)
async def update_form_template(
    template_id: UUID,
    template_in: FormTemplateUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Atualiza a estrutura (schema) ou nome de um template de formulário.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(FormTemplate, tenant_id).filter(FormTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado")

    update_data = template_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    return template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form_template(
    template_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Remove um template de formulário.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(FormTemplate, tenant_id).filter(FormTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado")

    await db.delete(template)
    await db.commit()
    return None
