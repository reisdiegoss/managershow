from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_wizard_complete_unauthorized():
    """Testa que se chamada sem token administrativo o wizard recusa payload."""
    response = client.post("/api/v1/client/wizard/complete", json={
        "primary_color": "#123456",
        "negotiation_setup": {"model": "CACHE"}
    })
    # Como as rotas testadas exigem clerk, e eu nao passo no header da req ele devolve 403 / 401
    assert response.status_code in [401, 403]
