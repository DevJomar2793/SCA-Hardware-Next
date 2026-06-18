from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from ckt_numbers import generate_next_ckt_number
from database import get_db


router = APIRouter(prefix="/api/v1", tags=["hardware"])


@router.post("/add-hardware", response_model=schemas.Hardware, status_code=201)
def create_hardware(hardware: schemas.HardwareCreate, db: Session = Depends(get_db)):
    hardware_data = hardware.dict()
    validation_error = schemas.missing_required_hardware_message(hardware_data)
    if validation_error:
        raise HTTPException(status_code=422, detail=validation_error)

    hardware_data["ckt_item_number"] = generate_next_ckt_number(
        hardware_data.get("hardware_type"),
        db,
    )
    db_hardware = models.Hardware(**hardware_data)
    db.add(db_hardware)
    db.commit()
    db.refresh(db_hardware)
    return db_hardware


@router.get("/next-ckt-number")
def read_next_ckt_number(hardware_type: str, db: Session = Depends(get_db)):
    return {"ckt_item_number": generate_next_ckt_number(hardware_type, db)}


@router.get("/hardware-list", response_model=List[schemas.Hardware])
def read_hardware(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    return (
        db.query(models.Hardware)
        .order_by(models.Hardware.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/hardware-by-id/{hardware_id}", response_model=schemas.Hardware)
def read_hardware_by_id(hardware_id: int, db: Session = Depends(get_db)):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")
    return db_hardware


@router.put("/hardware/{hardware_id}", response_model=schemas.Hardware)
def update_hardware(
    hardware_id: int,
    hardware_update: schemas.HardwareUpdate,
    db: Session = Depends(get_db),
):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")

    update_data = hardware_update.dict(exclude_unset=True)
    merged_data = {
        field: getattr(db_hardware, field)
        for field in schemas.HARDWARE_VALIDATION_FIELDS
    }
    merged_data.update(update_data)

    validation_error = schemas.missing_required_hardware_message(merged_data)
    if validation_error:
        raise HTTPException(status_code=422, detail=validation_error)

    for key, value in update_data.items():
        setattr(db_hardware, key, value)

    db.commit()
    db.refresh(db_hardware)
    return db_hardware


@router.delete("/hardware/{hardware_id}", response_model=schemas.Hardware)
def delete_hardware(hardware_id: int, db: Session = Depends(get_db)):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")
    db.delete(db_hardware)
    db.commit()
    return db_hardware
