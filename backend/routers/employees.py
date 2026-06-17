from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db


router = APIRouter(prefix="/api/v1", tags=["employees"])


def get_employee_or_404(employee_id: int, db: Session) -> models.EmployeeDetails:
    db_employee = (
        db.query(models.EmployeeDetails)
        .filter(models.EmployeeDetails.id == employee_id)
        .first()
    )
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee


def ensure_employee_code_is_unique(
    employee_digit_code: str | None,
    db: Session,
    employee_id: int | None = None,
) -> None:
    if not employee_digit_code:
        return

    query = db.query(models.EmployeeDetails).filter(
        models.EmployeeDetails.employee_digit_code == employee_digit_code
    )
    if employee_id is not None:
        query = query.filter(models.EmployeeDetails.id != employee_id)

    if query.first() is not None:
        raise HTTPException(status_code=400, detail="Employee code already exists")


@router.post("/add-employee", response_model=schemas.EmployeeDetails, status_code=201)
def create_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
):
    ensure_employee_code_is_unique(employee.employee_digit_code, db)
    db_employee = models.EmployeeDetails(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.get("/employee-list", response_model=List[schemas.EmployeeDetails])
def read_employees(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    return (
        db.query(models.EmployeeDetails)
        .order_by(models.EmployeeDetails.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/employee-by-id/{employee_id}", response_model=schemas.EmployeeDetails)
def read_employee_by_id(employee_id: int, db: Session = Depends(get_db)):
    return get_employee_or_404(employee_id, db)


@router.put("/employee/{employee_id}", response_model=schemas.EmployeeDetails)
def update_employee(
    employee_id: int,
    employee_update: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
):
    db_employee = get_employee_or_404(employee_id, db)
    update_data = employee_update.dict(exclude_unset=True)

    ensure_employee_code_is_unique(
        update_data.get("employee_digit_code"),
        db,
        employee_id,
    )

    for key, value in update_data.items():
        setattr(db_employee, key, value)

    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.delete("/employee/{employee_id}", response_model=schemas.EmployeeDetails)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = get_employee_or_404(employee_id, db)
    db.delete(db_employee)
    db.commit()
    return db_employee
