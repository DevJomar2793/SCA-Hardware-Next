from typing import List, Union

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db


router = APIRouter(prefix="/api/v1", tags=["assignments"])

RETURNED_STATUS = "returned"


def get_assignment_or_404(
    assignment_id: int,
    db: Session,
) -> models.AssignHardwareDetails:
    db_assignment = (
        db.query(models.AssignHardwareDetails)
        .filter(models.AssignHardwareDetails.id == assignment_id)
        .first()
    )
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Hardware assignment not found")
    return db_assignment


def ensure_employee_exists(employee_details_id: int, db: Session) -> None:
    db_employee = (
        db.query(models.EmployeeDetails)
        .filter(models.EmployeeDetails.id == employee_details_id)
        .first()
    )
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")


def ensure_hardware_exists(hardware_id: int, db: Session) -> None:
    db_hardware = (
        db.query(models.Hardware)
        .filter(models.Hardware.id == hardware_id)
        .first()
    )
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")


def is_active_assignment_data(status: str | None, date_returned: str | None) -> bool:
    return date_returned is None and (status or "").strip().lower() != RETURNED_STATUS


def ensure_hardware_is_available(
    hardware_id: int,
    db: Session,
    assignment_id: int | None = None,
) -> None:
    query = db.query(models.AssignHardwareDetails).filter(
        models.AssignHardwareDetails.hardware_id == hardware_id,
        models.AssignHardwareDetails.date_returned.is_(None),
        func.lower(models.AssignHardwareDetails.status) != RETURNED_STATUS,
    )
    if assignment_id is not None:
        query = query.filter(models.AssignHardwareDetails.id != assignment_id)

    if query.first() is not None:
        raise HTTPException(
            status_code=400,
            detail="Hardware is already assigned to an employee",
        )


@router.post(
    "/assign-hardware",
    response_model=List[schemas.AssignHardwareDetails],
    status_code=201,
)
def create_hardware_assignment(
    assignment: Union[schemas.AssignHardwareCreate, schemas.AssignHardwareBulkCreate],
    db: Session = Depends(get_db),
):
    ensure_employee_exists(assignment.employee_details_id, db)

    hardware_ids = (
        assignment.hardware_ids
        if isinstance(assignment, schemas.AssignHardwareBulkCreate)
        else [assignment.hardware_id]
    )

    if len(hardware_ids) == 0:
        raise HTTPException(status_code=422, detail="Select at least one hardware item")

    if len(set(hardware_ids)) != len(hardware_ids):
        raise HTTPException(status_code=400, detail="Duplicate hardware items selected")

    for hardware_id in hardware_ids:
        ensure_hardware_exists(hardware_id, db)

    if is_active_assignment_data(assignment.status, assignment.date_returned):
        for hardware_id in hardware_ids:
            ensure_hardware_is_available(hardware_id, db)

    base_assignment_data = assignment.dict(exclude={"hardware_ids", "hardware_id"})
    db_assignments = [
        models.AssignHardwareDetails(
            **base_assignment_data,
            hardware_id=hardware_id,
        )
        for hardware_id in hardware_ids
    ]

    db.add_all(db_assignments)

    db.commit()

    for db_assignment in db_assignments:
        db.refresh(db_assignment)

    return db_assignments


@router.get(
    "/assign-hardware-list",
    response_model=List[schemas.AssignHardwareDetails],
)
def read_hardware_assignments(
    skip: int = 0,
    limit: int = 5000,
    db: Session = Depends(get_db),
):
    return (
        db.query(models.AssignHardwareDetails)
        .order_by(models.AssignHardwareDetails.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get(
    "/assign-hardware/{assignment_id}/hardware-items",
    response_model=List[schemas.Hardware],
)
def read_hardware_items_for_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    db_assignment = get_assignment_or_404(assignment_id, db)

    return (
        db.query(models.Hardware)
        .join(
            models.AssignHardwareDetails,
            models.AssignHardwareDetails.hardware_id == models.Hardware.id,
        )
        .filter(
            models.AssignHardwareDetails.employee_details_id
            == db_assignment.employee_details_id,
            models.AssignHardwareDetails.date_returned.is_(None),
            func.lower(models.AssignHardwareDetails.status) != RETURNED_STATUS,
        )
        .order_by(models.AssignHardwareDetails.id.desc())
        .all()
    )


@router.get(
    "/assign-hardware/{assignment_id}",
    response_model=schemas.AssignHardwareDetails,
)
def read_hardware_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    return get_assignment_or_404(assignment_id, db)


@router.put(
    "/assign-hardware/{assignment_id}",
    response_model=schemas.AssignHardwareDetails,
)
def update_hardware_assignment(
    assignment_id: int,
    assignment_update: schemas.AssignHardwareUpdate,
    db: Session = Depends(get_db),
):
    db_assignment = get_assignment_or_404(assignment_id, db)
    update_data = assignment_update.dict(exclude_unset=True)

    employee_details_id = update_data.get(
        "employee_details_id",
        db_assignment.employee_details_id,
    )
    hardware_id = update_data.get("hardware_id", db_assignment.hardware_id)
    status = update_data.get("status", db_assignment.status)
    date_returned = update_data.get("date_returned", db_assignment.date_returned)

    if "employee_details_id" in update_data:
        ensure_employee_exists(employee_details_id, db)
    if "hardware_id" in update_data:
        ensure_hardware_exists(hardware_id, db)
    if is_active_assignment_data(status, date_returned):
        ensure_hardware_is_available(hardware_id, db, assignment_id)

    for key, value in update_data.items():
        setattr(db_assignment, key, value)

    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.put(
    "/assign-hardware/{assignment_id}/return",
    response_model=schemas.AssignHardwareDetails,
)
def return_hardware_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    db_assignment = get_assignment_or_404(assignment_id, db)
    db_assignment.status = "Returned"
    if db_assignment.date_returned is None:
        db_assignment.date_returned = models.current_timestamp()

    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.delete(
    "/assign-hardware/{assignment_id}",
    response_model=schemas.AssignHardwareDetails,
)
def delete_hardware_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    db_assignment = get_assignment_or_404(assignment_id, db)
    db.delete(db_assignment)
    db.commit()
    return db_assignment
