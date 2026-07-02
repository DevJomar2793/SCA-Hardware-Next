from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db


router = APIRouter(prefix="/api/v1/history", tags=["history"])

HARDWARE_SNAPSHOT_FIELDS = {
    "device_ckt_item_number": "ckt_item_number",
    "device_hardware_type": "hardware_type",
    "device_manufacturer": "manufacturer",
    "device_model_number": "model_number",
    "device_serial_number": "serial_number",
}
EMPLOYEE_SNAPSHOT_FIELDS = {
    "employee_digit_code": "employee_digit_code",
    "employee_first_name": "first_name",
    "employee_last_name": "last_name",
    "employee_position": "position",
    "employee_department": "department",
}


def get_history_or_404(history_id: int, db: Session) -> models.DeviceHistory:
    history_record = (
        db.query(models.DeviceHistory)
        .filter(models.DeviceHistory.id == history_id)
        .first()
    )
    if history_record is None:
        raise HTTPException(status_code=404, detail="History record not found")
    return history_record


def get_hardware_or_404(device_id: int, db: Session) -> models.Hardware:
    hardware = (
        db.query(models.Hardware).filter(models.Hardware.id == device_id).first()
    )
    if hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")
    return hardware


def get_employee_or_404(employee_id: int, db: Session) -> models.EmployeeDetails:
    employee = (
        db.query(models.EmployeeDetails)
        .filter(models.EmployeeDetails.id == employee_id)
        .first()
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def capture_hardware_snapshot(
    history_record: models.DeviceHistory,
    hardware: models.Hardware,
) -> None:
    for history_field, hardware_field in HARDWARE_SNAPSHOT_FIELDS.items():
        setattr(history_record, history_field, getattr(hardware, hardware_field))


def capture_employee_snapshot(
    history_record: models.DeviceHistory,
    employee: models.EmployeeDetails,
) -> None:
    for history_field, employee_field in EMPLOYEE_SNAPSHOT_FIELDS.items():
        setattr(history_record, history_field, getattr(employee, employee_field))


def upsert_assignment_history(
    assignment: models.AssignHardwareDetails,
    db: Session,
) -> models.DeviceHistory:
    history_record = (
        db.query(models.DeviceHistory)
        .filter(models.DeviceHistory.assignment_id == assignment.id)
        .first()
    )
    if history_record is None:
        history_record = models.DeviceHistory(assignment_id=assignment.id)
        db.add(history_record)

    history_record.device_id = assignment.hardware_id
    history_record.employee_id = assignment.employee_details_id
    history_record.date_assigned = assignment.date_assigned
    history_record.date_returned = assignment.date_returned
    history_record.status = assignment.status
    history_record.history = assignment.history
    history_record.notes = assignment.notes
    history_record.updated_at = models.current_timestamp()
    capture_hardware_snapshot(history_record, assignment.hardware)
    capture_employee_snapshot(history_record, assignment.employee)
    return history_record


@router.post(
    "",
    response_model=schemas.DeviceHistoryDetails,
    status_code=201,
)
def create_history(
    history_data: schemas.DeviceHistoryCreate,
    db: Session = Depends(get_db),
):
    hardware = get_hardware_or_404(history_data.device_id, db)
    employee = get_employee_or_404(history_data.employee_id, db)
    history_record = models.DeviceHistory(**history_data.model_dump())
    capture_hardware_snapshot(history_record, hardware)
    capture_employee_snapshot(history_record, employee)

    db.add(history_record)
    db.commit()
    db.refresh(history_record)
    return history_record


@router.get("", response_model=List[schemas.DeviceHistoryDetails])
def read_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(5000, ge=1, le=5000),
    device_id: int | None = None,
    employee_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.DeviceHistory)
    if device_id is not None:
        query = query.filter(models.DeviceHistory.device_id == device_id)
    if employee_id is not None:
        query = query.filter(models.DeviceHistory.employee_id == employee_id)
    if status and status.strip():
        query = query.filter(
            func.lower(models.DeviceHistory.status) == status.strip().lower()
        )

    return (
        query.order_by(models.DeviceHistory.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{history_id}", response_model=schemas.DeviceHistoryDetails)
def read_history_by_id(history_id: int, db: Session = Depends(get_db)):
    return get_history_or_404(history_id, db)


@router.put("/{history_id}", response_model=schemas.DeviceHistoryDetails)
def update_history(
    history_id: int,
    history_update: schemas.DeviceHistoryUpdate,
    db: Session = Depends(get_db),
):
    history_record = get_history_or_404(history_id, db)
    update_data = history_update.model_dump(exclude_unset=True)
    required_fields = {"device_id", "employee_id", "date_assigned", "status"}
    null_required_fields = [
        field
        for field in required_fields
        if field in update_data and update_data[field] is None
    ]
    if null_required_fields:
        raise HTTPException(
            status_code=422,
            detail=f"Fields cannot be null: {', '.join(sorted(null_required_fields))}",
        )

    if "device_id" in update_data:
        hardware = get_hardware_or_404(update_data["device_id"], db)
        capture_hardware_snapshot(history_record, hardware)
    if "employee_id" in update_data:
        employee = get_employee_or_404(update_data["employee_id"], db)
        capture_employee_snapshot(history_record, employee)

    for key, value in update_data.items():
        setattr(history_record, key, value)

    db.commit()
    db.refresh(history_record)
    return history_record


@router.delete("/{history_id}", status_code=204)
def delete_history(history_id: int, db: Session = Depends(get_db)):
    history_record = get_history_or_404(history_id, db)
    db.delete(history_record)
    db.commit()
    return Response(status_code=204)
