import io
import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from fastapi import HTTPException

# Configuração do Jinja2
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
template_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

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
            raise HTTPException(status_code=500, detail="Erro interno ao gerar o arquivo PDF.")
        
        result.seek(0)
        return result

    @staticmethod
    def render_template(template_name: str, context: dict) -> str:
        """
        Renderiza um template HTML usando Jinja2.
        """
        try:
            template = template_env.get_template(template_name)
            # Injetar timestamp global se não houver
            if "generated_at" not in context:
                context["generated_at"] = datetime.now().strftime("%d/%m/%Y %H:%M")
            return template.render(context)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao carregar template PDF: {str(e)}")

    @classmethod
    def get_contract_pdf(cls, show_data: dict) -> io.BytesIO:
        """Gera o PDF do contrato usando o template externo."""
        html = cls.render_template("contract_template.html", show_data)
        return cls.generate_pdf(html)

    @classmethod
    def get_daysheet_pdf(cls, show_data: dict, team: list) -> io.BytesIO:
        """Gera o PDF do Day Sheet usando o template externo."""
        context = {**show_data, "team": team}
        html = cls.render_template("daysheet_template.html", context)
        return cls.generate_pdf(html)
