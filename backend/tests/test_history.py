import pytest
from fastapi.testclient import TestClient

import models
from database import SessionLocal
from main import app


client = TestClient(app)


@pytest.fixture()
def history_sources():
    db = SessionLocal()
    try:
        db.query(models.DeviceHistory).delete()
        db.query(models.AcknowledgementSignature).delete()
        db.query(models.AssignHardwareDetails).delete()
        db.query(models.Hardware).delete()
        db.query(models.EmployeeDetails).delete()

        employee = models.EmployeeDetails(
            employee_digit_code="EMP-HISTORY",
            first_name="Ana",
            last_name="Santos",
            position="Technician",
            department="IT",
        )
        hardware = models.Hardware(
            ckt_item_number="CKT-HISTORY",
            hardware_type="Laptop",
            qty=1,
            manufacturer="Dell",
            model_number="Latitude 5420",
            serial_number="HISTORY-TEST-SERIAL",
            operational="Operational",
            new_or_used="Used",
        )
        db.add_all([employee, hardware])
        db.commit()
        db.refresh(employee)
        db.refresh(hardware)
        yield {"employee_id": employee.id, "hardware_id": hardware.id}
    finally:
        db.close()


def create_manual_history(history_sources):
    return client.post(
        "/api/v1/history",
        json={
            "device_id": history_sources["hardware_id"],
            "employee_id": history_sources["employee_id"],
            "date_assigned": "2026-06-01",
            "date_returned": "2026-07-01",
            "status": "Returned",
            "history": "Initial deployment",
            "notes": "Returned in good condition",
        },
    )


def test_manual_history_crud_and_filters(history_sources):
    response = create_manual_history(history_sources)
    assert response.status_code == 201
    record = response.json()
    assert record["assignment_id"] is None
    assert record["hardware"]["ckt_item_number"] == "CKT-HISTORY"
    assert record["employee"]["first_name"] == "Ana"

    response = client.get(
        "/api/v1/history",
        params={
            "device_id": history_sources["hardware_id"],
            "employee_id": history_sources["employee_id"],
            "status": "returned",
        },
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [record["id"]]

    response = client.put(
        f"/api/v1/history/{record['id']}",
        json={"notes": "Updated condition note"},
    )
    assert response.status_code == 200
    assert response.json()["notes"] == "Updated condition note"

    assert client.get(f"/api/v1/history/{record['id']}").status_code == 200
    assert client.delete(f"/api/v1/history/{record['id']}").status_code == 204
    assert client.get(f"/api/v1/history/{record['id']}").status_code == 404


def test_history_snapshots_survive_source_changes_and_deletion(history_sources):
    record = create_manual_history(history_sources).json()

    db = SessionLocal()
    try:
        hardware = db.get(models.Hardware, history_sources["hardware_id"])
        employee = db.get(models.EmployeeDetails, history_sources["employee_id"])
        hardware.model_number = "Changed Model"
        employee.first_name = "Changed"
        db.commit()
    finally:
        db.close()

    stored_record = client.get(f"/api/v1/history/{record['id']}").json()
    assert stored_record["hardware"]["model_number"] == "Latitude 5420"
    assert stored_record["employee"]["first_name"] == "Ana"

    assert client.delete(
        f"/api/v1/hardware/{history_sources['hardware_id']}"
    ).status_code == 200
    assert client.delete(
        f"/api/v1/employee/{history_sources['employee_id']}"
    ).status_code == 200
    assert client.get(f"/api/v1/history/{record['id']}").status_code == 200


def test_return_upserts_one_history_record(history_sources):
    assignment_response = client.post(
        "/api/v1/assign-hardware",
        json={
            "employee_details_id": history_sources["employee_id"],
            "hardware_id": history_sources["hardware_id"],
            "date_assigned": "2026-06-15",
            "status": "Assigned",
            "history": "First value",
        },
    )
    assignment_id = assignment_response.json()[0]["id"]

    assert client.put(
        f"/api/v1/assign-hardware/{assignment_id}/return"
    ).status_code == 200

    db = SessionLocal()
    try:
        assignment = db.get(models.AssignHardwareDetails, assignment_id)
        hardware = db.get(models.Hardware, history_sources["hardware_id"])
        assignment.history = "Refreshed value"
        hardware.model_number = "Refreshed Model"
        db.commit()
    finally:
        db.close()

    assert client.put(
        f"/api/v1/assign-hardware/{assignment_id}/return"
    ).status_code == 200
    records = client.get(
        "/api/v1/history",
        params={"device_id": history_sources["hardware_id"]},
    ).json()
    assert len(records) == 1
    assert records[0]["assignment_id"] == assignment_id
    assert records[0]["history"] == "Refreshed value"
    assert records[0]["hardware"]["model_number"] == "Refreshed Model"


def test_history_validates_references_and_required_updates(history_sources):
    invalid_create = client.post(
        "/api/v1/history",
        json={
            "device_id": 999999,
            "employee_id": history_sources["employee_id"],
            "date_assigned": "2026-06-01",
            "status": "Returned",
        },
    )
    assert invalid_create.status_code == 404

    record = create_manual_history(history_sources).json()
    invalid_update = client.put(
        f"/api/v1/history/{record['id']}",
        json={"status": None},
    )
    assert invalid_update.status_code == 422
