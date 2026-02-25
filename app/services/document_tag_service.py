"""
Manager Show — Service: DocumentTags (Mapeador de Variáveis)

Este serviço é responsável por extrair dados das entidades (Show, Artist, Contractor)
e transformá-los em um dicionário de 'tags' amigáveis para o motor de templates Jinja2.
"""

from decimal import Decimal
from datetime import date, datetime
from app.models.show import Show
from app.models.artist import Artist
from app.models.contractor import Contractor

class DocumentTagService:
    @staticmethod
    def get_show_tags(show: Show) -> dict:
        """Extrai tags de um Show para o contrato/proposta."""
        return {
            # Show
            "show_id": str(show.id),
            "show_date": show.date_show.strftime("%d/%m/%Y"),
            "show_city": show.location_city,
            "show_uf": show.location_uf,
            "show_location": show.location_venue_name or (show.venue.name if show.venue else "Local não definido"),
            "show_notes": show.notes or "",
            
            # Valores
            "base_price": show.base_price,
            "real_cache": show.real_cache,
            "kickback": show.production_kickback,
            
            # Artista
            "artist_name": show.artist.name if show.artist else "N/A",
            
            # Contratante
            "contractor_name": show.contractor.name if show.contractor else "N/A",
            "contractor_document": show.contractor.document if show.contractor else "N/A",
            "contractor_email": show.contractor.contact_email if show.contractor else "N/A",
            "contractor_phone": show.contractor.contact_phone if show.contractor else "N/A",
            
            # Contexto Temporal
            "generated_at": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "today_long": datetime.now().strftime("%d de %B de %Y") # Precisa de locale se quiser em PT
        }

    @staticmethod
    def get_artist_tags(artist: Artist) -> dict:
        """Extrai tags de um Artista."""
        return {
            "artist_name": artist.name,
            "artist_bio": artist.bio or "",
            "artist_genre": artist.genre or "N/A"
        }

    @staticmethod
    def get_contractor_tags(contractor: Contractor) -> dict:
        """Extrai tags de um Contratante."""
        return {
            "name": contractor.name,
            "document": contractor.document,
            "email": contractor.contact_email,
            "phone": contractor.contact_phone,
            "address": contractor.address or "N/A"
        }
