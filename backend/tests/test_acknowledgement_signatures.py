import base64

import pytest

from fastapi.testclient import TestClient  # noqa: E402

import models  # noqa: E402
from database import SessionLocal  # noqa: E402
from main import app  # noqa: E402


client = TestClient(app)
valid_signature = "data:image/png;base64," + base64.b64encode(
    b"\x89PNG\r\n\x1a\nsignature"
).decode("ascii")
replacement_signature = "data:image/png;base64," + base64.b64encode(
    b"\x89PNG\r\n\x1a\nreplacement"
).decode("ascii")


@pytest.fixture()
def assignment_id():
    db = SessionLocal()
    try:
        db.query(models.DeviceHistory).delete()
        db.query(models.AcknowledgementSignature).delete()
        db.query(models.AssignHardwareDetails).delete()
        db.query(models.Hardware).delete()
        db.query(models.EmployeeDetails).delete()

        employee = models.EmployeeDetails(
            employee_digit_code="EMP-SIGN",
            first_name="Ana",
            last_name="Santos",
        )
        hardware = models.Hardware(
            ckt_item_number="CKT-SIGN",
            hardware_type="Laptop",
            qty=1,
            manufacturer="Dell",
            model_number="Latitude",
            serial_number="SIGNATURE-TEST-SERIAL",
            operational="Operational",
            new_or_used="Used",
        )
        db.add_all([employee, hardware])
        db.flush()
        assignment = models.AssignHardwareDetails(
            employee_details_id=employee.id,
            hardware_id=hardware.id,
            date_assigned="2026-06-30",
            status="Assigned",
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        yield assignment.id
    finally:
        db.close()


def signature_url(assignment_id: int):
    return (
        f"/api/v1/assign-hardware/{assignment_id}/"
        "acknowledgement-signatures/prepared_by"
    )


def test_signature_can_be_saved_replaced_and_removed(assignment_id):
    response = client.get(signature_url(assignment_id))
    assert response.status_code == 200
    assert response.json() is None

    response = client.put(
        signature_url(assignment_id),
        json={"signature_data": valid_signature},
    )
    assert response.status_code == 200
    assert response.json()["signature_data"] == valid_signature

    response = client.put(
        signature_url(assignment_id),
        json={"signature_data": replacement_signature},
    )
    assert response.status_code == 200
    assert response.json()["signature_data"] == replacement_signature

    response = client.delete(signature_url(assignment_id))
    assert response.status_code == 204
    assert client.get(signature_url(assignment_id)).json() is None


def test_signature_rejects_invalid_png_data(assignment_id):
    response = client.put(
        signature_url(assignment_id),
        json={"signature_data": "data:image/png;base64,bm90LWEtcG5n"},
    )
    assert response.status_code == 422
    assert "not a valid PNG" in response.text


def test_signature_rejects_unknown_assignment_and_signatory(assignment_id):
    response = client.get(
        f"/api/v1/assign-hardware/{assignment_id}/"
        "acknowledgement-signatures/approved_by"
    )
    assert response.status_code == 404

    response = client.get(signature_url(999_999))
    assert response.status_code == 404
