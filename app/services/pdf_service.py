"""
Manager Show — Service: Geração de PDF
"""

import io
from xhtml2pdf import pisa
from fastapi import HTTPException


class PDFService:
    @staticmethod
    def generate_pdf(html_content: str) -> io.BytesIO:
        """
        Converte conteúdo HTML em PDF usando xhtml2pdf.
        Retorna um stream de bytes.
        """
        result = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=result)
        
        if pisa_status.err:
            raise HTTPException(status_code=500, detail="Erro ao gerar o PDF.")
        
        result.seek(0)
        return result

    @staticmethod
    def get_contract_template(show_data: dict) -> str:
        """Template HTML básico para a Minuta de Contrato."""
        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1 {{ text-align: center; color: #333; }}
                .section {{ margin-bottom: 20px; }}
                .label {{ font-weight: bold; }}
            </style>
        </head>
        <body>
            <h1>MINUTA DE CONTRATO ARTÍSTICO</h1>
            <div class="section">
                <p><span class="label">ARTISTA:</span> {show_data['artist_name']}</p>
                <p><span class="label">CONTRATANTE:</span> {show_data['contractor_name']}</p>
                <p><span class="label">DATA DO SHOW:</span> {show_data['date']}</p>
                <p><span class="label">LOCAL:</span> {show_data['venue_name']} - {show_data['city']}/{show_data['uf']}</p>
                <p><span class="label">VALOR DO CACHÊ:</span> R$ {show_data['price']}</p>
            </div>
            <div class="section">
                <p>Este documento é uma minuta proferida pelo sistema Manager Show.</p>
            </div>
        </body>
        </html>
        """

    @staticmethod
    def get_daysheet_template(show_data: dict, team: list) -> str:
        """Template HTML básico para o Day Sheet."""
        team_html = "".join([f"<li>{member}</li>" for member in team])
        return f"""
        <html>
        <head>
            <style>
                body {{ font-family: sans-serif; margin: 40px; }}
                header {{ border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }}
                .item {{ margin: 10px 0; }}
            </style>
        </head>
        <body>
            <header>
                <h1>DAY SHEET - {show_data['artist_name']}</h1>
                <p>{show_data['date']} | {show_data['venue_name']}</p>
            </header>
            <div class="item"><strong>CIDADE:</strong> {show_data['city']}/{show_data['uf']}</div>
            <div class="item"><strong>ENDEREÇO:</strong> {show_data['address']}</div>
            
            <h3>EQUIPE CONFIRMADA:</h3>
            <ul>
                {team_html}
            </ul>
        </body>
        </html>
        """
