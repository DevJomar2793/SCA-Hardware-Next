from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
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


def create_return_history(
    assignment: models.AssignHardwareDetails,
    return_reason: str,
    db: Session,
) -> models.DeviceHistory:
    existing_record = (
        db.query(models.DeviceHistory)
        .filter(models.DeviceHistory.assignment_id == assignment.id)
        .first()
    )
    if existing_record is not None:
        raise HTTPException(
            status_code=409,
            detail="A return history record already exists for this assignment",
        )

    history_record = models.DeviceHistory(
        assignment_id=assignment.id,
        device_id=assignment.hardware_id,
        employee_id=assignment.employee_details_id,
        date_assigned=assignment.date_assigned,
        date_returned=assignment.date_returned,
        status=assignment.status,
        return_reason=return_reason,
        history=assignment.history,
        notes=assignment.notes,
    )
    capture_hardware_snapshot(history_record, assignment.hardware)
    capture_employee_snapshot(history_record, assignment.employee)
    db.add(history_record)
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


@router.get("/returns", response_model=List[schemas.DeviceHistoryDetails])
def read_return_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(5000, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.DeviceHistory)
        .filter(models.DeviceHistory.date_returned.is_not(None))
        .order_by(
            models.DeviceHistory.date_returned.desc(),
            models.DeviceHistory.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{history_id}", response_model=schemas.DeviceHistoryDetails)
def read_history_by_id(history_id: int, db: Session = Depends(get_db)):
    return get_history_or_404(history_id, db)
