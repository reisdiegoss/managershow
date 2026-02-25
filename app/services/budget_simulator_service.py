"""
Manager Show — Service: BI Previsional (Simulador de Budget & Valor de Face)

Este serviço é o cérebro da precificação dinâmica. Ele elimina o hardcode de 15%
e trata a 'Cegueira do Valor de Face' em contratos públicos.

Matemática do BI:
- Real Cache (Liquidez): Valor de Face - Repasse (Kickback).
- Budget Logístico: Baseado no histórico real da praça (CityBaseCost).
"""

import uuid
from decimal import Decimal
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.show import Show, ClientType, NegotiationType
from app.models.city_base_cost import CityBaseCost

async def calculate_dynamic_budget_and_face_value(show: Show, db: AsyncSession) -> dict:
    """
    Calcula a projeção financeira real do show.
    
    Retorna:
    - real_cache: Liquidez efetiva (Face - Kickback)
    - logistics_budget_limit: Teto de gastos baseado na praça
    """
    
    # --- 1. Lógica de Valor de Face (Cegueira de Prefeituras) ---
    # REGRA: Em contratos públicos, o 'Valor de Face' (base_price) contém o repasse.
    # O lucro real deve ser calculado sobre o cachê líquido (Liquidez).
    
    base_price = Decimal(str(show.base_price))
    kickback = Decimal(str(show.production_kickback or 0))
    
    if show.client_type == ClientType.PUBLIC:
        real_cache = base_price - kickback
    else:
        # Em mercado privado, o valor de face é a liquidez (geralmente)
        real_cache = base_price
        
    # --- 2. Lógica de Logística (Motor de Budget Dinâmico) ---
    # REGRA: Eliminar hardcode de 0.15 * cache.
    
    budget_limit = Decimal("0")
    
    if show.negotiation_type == NegotiationType.CACHE_MAIS_DESPESAS:
        # Contratante assume a logística local/total. Risco da produtora é zero ou residual.
        budget_limit = Decimal("0")
    
    elif show.negotiation_type == NegotiationType.COLOCADO_TOTAL:
        # Produtora assume TUDO. Buscamos a média histórica da cidade.
        stmt = select(func.avg(CityBaseCost.cost_amount)).where(
            CityBaseCost.city == show.location_city,
            CityBaseCost.uf == show.location_uf,
            CityBaseCost.tenant_id == show.tenant_id
        )
        result = await db.execute(stmt)
        avg_cost = result.scalar()
        
        if avg_cost:
            budget_limit = Decimal(str(avg_cost))
        else:
            # Fallback seguro se não houver histórico: 20% (mais conservador que os 15% anteriores)
            budget_limit = real_cache * Decimal("0.20")
            
    elif show.negotiation_type == NegotiationType.CACHE_MAIS_AEREO:
        # Produtora paga aéreo. Buscamos média de 'FLIGHT'.
        stmt = select(func.avg(CityBaseCost.cost_amount)).where(
            CityBaseCost.city == show.location_city,
            CityBaseCost.uf == show.location_uf,
            CityBaseCost.category == "FLIGHT",
            CityBaseCost.tenant_id == show.tenant_id
        )
        result = await db.execute(stmt)
        avg_flight = result.scalar()
        
        if avg_flight:
            budget_limit = Decimal(str(avg_flight))
        else:
            budget_limit = real_cache * Decimal("0.10") # Fallback
            
    return {
        "real_cache": real_cache,
        "logistics_budget_limit": budget_limit
    }
