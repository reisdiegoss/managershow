"""
Manager Show — Exceções Customizadas

Exceções de domínio que são capturadas pelo Exception Handler global
no main.py e convertidas em respostas JSON padronizadas.

REGRA DO GUIA TÉCNICO: Nunca vazar mensagens internas (ex: IntegrityError)
para o cliente. Sempre usar exceções de domínio com mensagens claras em PT-BR.
"""

from uuid import UUID


class ManagerShowException(Exception):
    """Exceção base do Manager Show. Todas as exceções de domínio herdam desta."""

    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = 400,
        details: list | None = None,
    ) -> None:
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(self.message)


# =============================================================================
# Exceções de Autenticação e Autorização
# =============================================================================


class InvalidTokenException(ManagerShowException):
    """Token JWT inválido ou expirado."""

    def __init__(self) -> None:
        super().__init__(
            error_code="INVALID_TOKEN",
            message="Token de autenticação inválido ou expirado.",
            status_code=401,
        )


class PermissionDeniedException(ManagerShowException):
    """Usuário não possui a permissão necessária para esta ação."""

    def __init__(self, permission: str = "") -> None:
        msg = "Você não possui permissão para realizar esta ação."
        if permission:
            msg = f"Permissão necessária: {permission}."
        super().__init__(
            error_code="PERMISSION_DENIED",
            message=msg,
            status_code=403,
        )


# =============================================================================
# Exceções de Multi-Tenancy
# =============================================================================


class TenantSuspendedException(ManagerShowException):
    """Tenant com assinatura suspensa. Acesso à API bloqueado."""

    def __init__(self) -> None:
        super().__init__(
            error_code="TENANT_SUSPENDED",
            message="Sua conta está suspensa. Entre em contato com o suporte para regularizar a assinatura.",
            status_code=403,
        )


class TenantNotFoundException(ManagerShowException):
    """Tenant não encontrado no banco de dados."""

    def __init__(self, tenant_id: UUID | str = "") -> None:
        msg = "Escritório/Agência não encontrado."
        if tenant_id:
            msg = f"Escritório/Agência com ID {tenant_id} não encontrado."
        super().__init__(
            error_code="TENANT_NOT_FOUND",
            message=msg,
            status_code=404,
        )


# =============================================================================
# Exceções de Negócio — Shows
# =============================================================================


class ShowNotFoundException(ManagerShowException):
    """Show não encontrado ou não pertence ao tenant do usuário."""

    def __init__(self, show_id: UUID | str = "") -> None:
        msg = "Show não encontrado."
        if show_id:
            msg = f"Show com ID {show_id} não encontrado."
        super().__init__(
            error_code="SHOW_NOT_FOUND",
            message=msg,
            status_code=404,
        )


class ContractNotSignedException(ManagerShowException):
    """
    TRAVA MESTRA — Tentativa de inserir despesas/logística sem contrato validado.

    REGRA DA BÍBLIA (Regra 02): O sistema deve bloquear qualquer inserção
    de despesa na Etapa 3 se a flag contract_validated for False.
    """

    def __init__(self) -> None:
        super().__init__(
            error_code="CONTRACT_NOT_SIGNED",
            message="Contrato não assinado. Despesas e lançamentos logísticos estão bloqueados até a validação do contrato.",
            status_code=403,
        )


class NegotiationTypeLockedExcepion(ManagerShowException):
    """
    REGRA DA BÍBLIA (Regra 01): Não é permitido alterar o Tipo de
    Negociação após o Contrato ser gerado.
    """

    def __init__(self) -> None:
        super().__init__(
            error_code="NEGOTIATION_TYPE_LOCKED",
            message="O tipo de negociação não pode ser alterado após a geração do contrato.",
            status_code=403,
        )


class DRENotReadyException(ManagerShowException):
    """
    REGRA DA BÍBLIA (Regra 03): O DRE só pode ser consolidado após o
    check-in de presença da equipe (Etapa 5).
    """

    def __init__(self) -> None:
        super().__init__(
            error_code="DRE_NOT_READY",
            message="O DRE não pode ser consolidado. O check-in de presença da equipe ainda não foi realizado.",
            status_code=422,
        )


# =============================================================================
# Exceções Genéricas
# =============================================================================


class ResourceNotFoundException(ManagerShowException):
    """Recurso genérico não encontrado."""

    def __init__(self, resource: str = "Recurso", resource_id: UUID | str = "") -> None:
        msg = f"{resource} não encontrado."
        if resource_id:
            msg = f"{resource} com ID {resource_id} não encontrado."
        super().__init__(
            error_code="RESOURCE_NOT_FOUND",
            message=msg,
            status_code=404,
        )


class BudgetOverflowException(ManagerShowException):
    """Lançamento de custo ultrapassa o orçamento previsto."""

    def __init__(self, budgeted: str = "", realized: str = "") -> None:
        msg = "O valor lançado ultrapassa o orçamento previsto para esta categoria."
        if budgeted and realized:
            msg = f"Orçamento estourado! Previsto: R$ {budgeted} | Lançado: R$ {realized}."
        super().__init__(
            error_code="BUDGET_OVERFLOW",
            message=msg,
            status_code=422,
            details=[{"budgeted": budgeted, "realized": realized}],
        )
