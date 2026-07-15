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


def create_assignment(history_sources):
    response = client.post(
        "/api/v1/assign-hardware",
        json={
            "employee_details_id": history_sources["employee_id"],
            "hardware_id": history_sources["hardware_id"],
            "date_assigned": "2026-06-15",
            "status": "Assigned",
        },
    )
    assert response.status_code == 201
    return response.json()[0]["id"]


def return_assignment(assignment_id, reason="Scheduled equipment replacement"):
    return client.put(
        f"/api/v1/assign-hardware/{assignment_id}/return",
        json={"return_reason": reason},
    )


def test_return_requires_reason_and_creates_snapshot(history_sources):
    assignment_id = create_assignment(history_sources)

    assert return_assignment(assignment_id, "   ").status_code == 422
    assert client.put(
        f"/api/v1/assign-hardware/{assignment_id}/return"
    ).status_code == 422

    db = SessionLocal()
    try:
        assignment = db.get(models.AssignHardwareDetails, assignment_id)
        assert assignment.status == "Assigned"
        assert assignment.date_returned is None
        assert db.query(models.DeviceHistory).count() == 0
    finally:
        db.close()

    response = return_assignment(assignment_id, "  Employee upgrade completed  ")
    assert response.status_code == 200
    assignment = response.json()
    assert assignment["status"] == "Unassigned"
    assert assignment["date_returned"] is not None

    records = client.get("/api/v1/history/returns").json()
    assert len(records) == 1
    record = records[0]
    assert record["assignment_id"] == assignment_id
    assert record["return_reason"] == "Employee upgrade completed"
    assert record["date_returned"] == assignment["date_returned"]
    assert record["hardware"]["ckt_item_number"] == "CKT-HISTORY"
    assert record["hardware"]["serial_number"] == "HISTORY-TEST-SERIAL"
    assert record["employee"]["first_name"] == "Ana"
    assert record["employee"]["last_name"] == "Santos"


def test_return_history_is_immutable_and_return_is_not_repeatable(history_sources):
    assignment_id = create_assignment(history_sources)
    assert return_assignment(assignment_id, "Original audit reason").status_code == 200
    record = client.get("/api/v1/history/returns").json()[0]

    repeat = return_assignment(assignment_id, "Attempted replacement reason")
    assert repeat.status_code == 409
    assert client.get(f"/api/v1/history/{record['id']}").json()[
        "return_reason"
    ] == "Original audit reason"

    assert client.post("/api/v1/history", json={}).status_code == 405
    assert client.put(
        f"/api/v1/history/{record['id']}", json={"return_reason": "Changed"}
    ).status_code == 405
    assert client.delete(f"/api/v1/history/{record['id']}").status_code == 405


def test_generic_assignment_update_cannot_bypass_return_reason(history_sources):
    assignment_id = create_assignment(history_sources)
    response = client.put(
        f"/api/v1/assign-hardware/{assignment_id}",
        json={"status": "Unassigned"},
    )
    assert response.status_code == 422
    assert "return endpoint" in response.json()["detail"]
    delete_response = client.delete(f"/api/v1/assign-hardware/{assignment_id}")
    assert delete_response.status_code == 422
    assert "return reason" in delete_response.json()["detail"]
    assert client.get("/api/v1/history/returns").json() == []


def test_history_snapshots_survive_source_changes_and_deletion(history_sources):
    assignment_id = create_assignment(history_sources)
    assert return_assignment(assignment_id, "End of deployment").status_code == 200
    record = client.get("/api/v1/history/returns").json()[0]

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


def test_return_history_is_sorted_by_returned_date_descending(history_sources):
    first_assignment_id = create_assignment(history_sources)
    assert return_assignment(first_assignment_id, "First return").status_code == 200
    second_assignment_id = create_assignment(history_sources)
    assert return_assignment(second_assignment_id, "Second return").status_code == 200

    db = SessionLocal()
    try:
        first = (
            db.query(models.DeviceHistory)
            .filter(models.DeviceHistory.assignment_id == first_assignment_id)
            .one()
        )
        second = (
            db.query(models.DeviceHistory)
            .filter(models.DeviceHistory.assignment_id == second_assignment_id)
            .one()
        )
        first.date_returned = "2026-07-14 09:00:00"
        second.date_returned = "2026-07-15 09:00:00"
        db.commit()
    finally:
        db.close()

    records = client.get("/api/v1/history/returns").json()
    assert [record["assignment_id"] for record in records] == [
        second_assignment_id,
        first_assignment_id,
    ]
