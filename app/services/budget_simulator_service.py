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

async def calculate_dynamic_budget_and_face_value(show: Show, db: AsyncSession, simulation_data: dict = None) -> dict:
    """
    Calcula a projeção financeira real do show.
    Se simulation_data vir populado do Simulador do Frontend (ProfitLight 2.0),
    os custos são projetados dinamicamente com base em QTD Voos * Media Cidade, etc.
    """
    
    # --- 1. Lógica de Valor de Face (Cegueira de Prefeituras) ---
    base_price = Decimal(str(show.base_price))
    kickback = Decimal(str(show.production_kickback or 0))
    
    if show.client_type == ClientType.PUBLIC:
        real_cache = base_price - kickback
    else:
        real_cache = base_price
        
    # --- 2. Lógica de Logística (Motor de Budget Dinâmico ou Estático) ---
    budget_limit = Decimal("0")
    
    if show.negotiation_type == NegotiationType.CACHE_MAIS_DESPESAS:
        budget_limit = Decimal("0")
    
    elif show.negotiation_type == NegotiationType.COLOCADO_TOTAL:
        # Se veio dados do simulador: QTD Passagens e Diárias
        if simulation_data and "flights_count" in simulation_data:
            transport_type = simulation_data.get("transport_type", "AEREO")
            flights_count = Decimal(str(simulation_data.get("flights_count", 0)))
            days_hotel = Decimal(str(simulation_data.get("days_hotel", 1)))
            
            total_transport = Decimal("0")
            total_hotel = Decimal("0")
            
            if transport_type == "AEREO" and flights_count > 0:
                stmt_f = select(func.avg(CityBaseCost.cost_amount)).where(
                    CityBaseCost.city == show.location_city,
                    CityBaseCost.uf == show.location_uf,
                    CityBaseCost.category == "FLIGHT",
                    CityBaseCost.tenant_id == show.tenant_id
                )
                res_f = await db.execute(stmt_f)
                avg_flight = res_f.scalar() or Decimal("1500.00") # Fallback Brasil
                total_transport = flights_count * Decimal(str(avg_flight))
                
            # Hospedagem default de fallback = R$300 (quartos duplos etc médias) - ajustado pelo db
            stmt_h = select(func.avg(CityBaseCost.cost_amount)).where(
                CityBaseCost.city == show.location_city,
                CityBaseCost.uf == show.location_uf,
                CityBaseCost.category == "LODGING",
                CityBaseCost.tenant_id == show.tenant_id
            )
            res_h = await db.execute(stmt_h)
            avg_hotel = res_h.scalar() or Decimal("300.00")
            total_hotel = days_hotel * Decimal(str(avg_hotel)) * Decimal("5") # Assume eq. de 10 pessoas / 2 per bed (Média)
            
            budget_limit = total_transport + total_hotel
            
        else:
            # Padrão Fixo (Não Simulado) - Preenche com total Average City Cost
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
                budget_limit = real_cache * Decimal("0.20")
            
    elif show.negotiation_type == NegotiationType.CACHE_MAIS_AEREO:
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
            budget_limit = real_cache * Decimal("0.10")
            
    return {
        "real_cache": real_cache,
        "logistics_budget_limit": budget_limit
    }
