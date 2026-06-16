import atexit
import os
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient

route_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
route_db.close()
os.environ["DATABASE_URL"] = f"sqlite:///{route_db.name}"
atexit.register(lambda: os.path.exists(route_db.name) and os.unlink(route_db.name))

from main import app
import models
from config import IMAGE_UPLOAD_DIR
from database import SessionLocal


def create_hardware(client: TestClient, serial_number: str) -> dict:
    response = client.post(
        "/api/v1/add-hardware",
        json={
            "hardware_type": "LAPTOP",
            "manufacturer": "Test",
            "model_number": "Model",
            "serial_number": serial_number,
            "qty": 1,
            "operational": "Operational",
            "new_or_used": "New",
        },
    )
    assert response.status_code == 201
    return response.json()


def add_image_record(hardware_id: int, image_path: str) -> None:
    db = SessionLocal()
    try:
        db.add(models.HardwareImage(hardware_id=hardware_id, image_path=image_path))
        db.commit()
    finally:
        db.close()


def test_next_ckt_number_route_returns_current_shape():
    client = TestClient(app)

    response = client.get("/api/v1/next-ckt-number", params={"hardware_type": "LAPTOP"})

    assert response.status_code == 200
    assert set(response.json()) == {"ckt_item_number"}


def test_delete_hardware_image_removes_record_and_file():
    client = TestClient(app)
    hardware = create_hardware(client, "delete-image-success")
    image_path = "/static/images/delete-image-success.png"
    image_file = Path(IMAGE_UPLOAD_DIR) / "delete-image-success.png"
    image_file.parent.mkdir(parents=True, exist_ok=True)
    image_file.write_bytes(b"image")
    add_image_record(hardware["id"], image_path)

    response = client.delete(
        f"/api/v1/hardware/{hardware['id']}/image",
        params={"image_path": image_path},
    )

    assert response.status_code == 200
    assert response.json() == {"deleted_image": image_path}
    assert not image_file.exists()

    db = SessionLocal()
    try:
        db_image = (
            db.query(models.HardwareImage)
            .filter(models.HardwareImage.image_path == image_path)
            .first()
        )
        assert db_image is None
    finally:
        db.close()


def test_delete_hardware_image_returns_404_when_hardware_missing():
    client = TestClient(app)

    response = client.delete(
        "/api/v1/hardware/999999/image",
        params={"image_path": "/static/images/missing.png"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Hardware not found"


def test_delete_hardware_image_returns_404_when_image_is_not_attached():
    client = TestClient(app)
    hardware = create_hardware(client, "delete-image-not-attached")

    response = client.delete(
        f"/api/v1/hardware/{hardware['id']}/image",
        params={"image_path": "/static/images/not-attached.png"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Hardware image not found"
