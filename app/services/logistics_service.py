"""
Manager Show — Service: Logistics (Integração Google e OpenWeather)

Este serviço gerencia chamadas externas para prover inteligência ao roteiro.
"""

import httpx
from decimal import Decimal
from app.config import get_settings

settings = get_settings()

class LogisticsService:
    @staticmethod
    async def get_route_details(origin: str, destination: str) -> dict:
        """
        Consulta o Google Distance Matrix API para obter distância e tempo.
        """
        if not settings.google_maps_api_key or settings.google_maps_api_key == "":
            return {"distance": None, "duration": None}

        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": origin,
            "destinations": destination,
            "key": settings.google_maps_api_key,
            "mode": "driving",
            "language": "pt-BR"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()

                if data["status"] == "OK":
                    element = data["rows"][0]["elements"][0]
                    if element["status"] == "OK":
                        return {
                            "distance": element["distance"]["text"],
                            "duration": element["duration"]["text"]
                        }
        except Exception as e:
            # Silently fail to not break the app workflow
            print(f"Erro Google Maps: {str(e)}")
        
        return {"distance": None, "duration": None}

    @staticmethod
    async def get_weather_forecast(city: str, date_str: str) -> dict:
        """
        Consulta o OpenWeather para obter previsão.
        Nota: A API gratuita de 5 dias/3 horas é limitada. 
        Para simplificar, buscamos o 'current' se for hoje ou o 'forecast'.
        """
        if not settings.openweather_api_key or settings.openweather_api_key == "":
            return {"temp": None, "condition": None}

        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": f"{city},BR",
            "appid": settings.openweather_api_key,
            "units": "metric",
            "lang": "pt_br"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                data = response.json()

                if response.status_code == 200:
                    return {
                        "temp": float(data["main"]["temp"]),
                        "condition": data["weather"][0]["description"].capitalize()
                    }
        except Exception as e:
            print(f"Erro OpenWeather: {str(e)}")
        
        return {"temp": None, "condition": None}
