import atexit
import os
import tempfile

from fastapi.testclient import TestClient

route_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
route_db.close()
os.environ["DATABASE_URL"] = f"sqlite:///{route_db.name}"
atexit.register(lambda: os.path.exists(route_db.name) and os.unlink(route_db.name))

from main import app


def test_next_ckt_number_route_returns_current_shape():
    client = TestClient(app)

    response = client.get("/api/v1/next-ckt-number", params={"hardware_type": "LAPTOP"})

    assert response.status_code == 200
    assert set(response.json()) == {"ckt_item_number"}
