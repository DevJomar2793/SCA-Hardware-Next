import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hardware Management API")

# Mount static directory for images
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/api/v1/add-hardware", response_model=schemas.Hardware, status_code=201)
def create_hardware(hardware: schemas.HardwareCreate, db: Session = Depends(get_db)):
    db_hardware = models.Hardware(**hardware.dict())
    db.add(db_hardware)
    db.commit()
    db.refresh(db_hardware)
    return db_hardware

@app.get("/api/v1/hardware-list", response_model=List[schemas.Hardware])
def read_hardware(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Hardware).offset(skip).limit(limit).all()

@app.get("/api/v1/hardware-by-id/{hardware_id}", response_model=schemas.Hardware)
def read_hardware_by_id(hardware_id: int, db: Session = Depends(get_db)):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")
    return db_hardware

@app.put("/api/v1/hardware/{hardware_id}", response_model=schemas.Hardware)
def update_hardware(hardware_id: int, hardware_update: schemas.HardwareUpdate, db: Session = Depends(get_db)):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")
    
    update_data = hardware_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_hardware, key, value)
    
    db.commit()
    db.refresh(db_hardware)
    return db_hardware

@app.post("/hardware/{hardware_id}/upload-image")
async def upload_hardware_image(hardware_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")
    
    # Define upload path
    upload_dir = "static/images"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"hardware_{hardware_id}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Update database with path
    db_hardware.image_path = f"/static/images/{file_name}"
    db.commit()
    
    return {"filename": file_name, "path": db_hardware.image_path}
