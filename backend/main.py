import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from config import CORS_ORIGINS
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hardware Management API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for images
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")


# <-------------------------------------------------Imports hardware to the database ------------------------------------------------->

@app.post("/api/v1/import-excel")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    import pandas as pd
    import io
    import re

    def safe_float(val):
        if val is None:
            return None
        try:
            if pd.isna(val):
                return None
        except (TypeError, ValueError):
            pass
        if isinstance(val, (int, float)):
            return float(val)
        try:
            # Remove currency symbols, commas, and whitespace
            cleaned = re.sub(r'[^\d.]', '', str(val))
            return float(cleaned) if cleaned else None
        except (ValueError, TypeError):
            return None

    def safe_str(val):
        """Convert a value to a clean string, or None if empty/NaN."""
        if val is None:
            return None
        try:
            if pd.isna(val):
                return None
        except (TypeError, ValueError):
            pass
        s = str(val).strip()
        return s if s and s.lower() not in ('nan', 'none', 'nat') else None

    def safe_int(val):
        """Convert a value to int, or None if empty/NaN."""
        if val is None:
            return None
        try:
            if pd.isna(val):
                return None
        except (TypeError, ValueError):
            pass
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return None

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

    try:
        contents = await file.read()
        # The actual headers are on the 3rd row (index 2)
        df = pd.read_excel(io.BytesIO(contents), header=2)

        # Mapping: Excel Column Header -> (model_attr, converter)
        COLUMN_MAPPING = {
            'CKT Item # / Code':                              ('ckt_item_number',  safe_str),
            'Hardware Type':                                   ('hardware_type',    safe_str),
            'Notes':                                           ('notes',            safe_str),
            'Date Tested':                                     ('date_tested',      safe_str),
            'Qty':                                             ('qty',              safe_int),
            'Manufacturer':                                    ('manufacturer',     safe_str),
            'Warranty':                                        ('warranty',         safe_str),
            'Model #':                                         ('model_number',     safe_str),
            'Serial #':                                        ('serial_number',    safe_str),
            'Screen\nSize ':                                   ('screen_size',      safe_str),
            'Processor Type / Screen Type':                   ('processor_type',   safe_str),
            'Processor Speed ':                               ('processor_speed',  safe_str),
            'Operating\nSystem/Android Version/MAC OS ':      ('operating_system', safe_str),
            'Ram':                                             ('ram',              safe_str),
            'HD type':                                         ('hd_type',          safe_str),
            'HD/STORAGE\nCapacity ':                          ('hd_storage',       safe_str),
            'Operational Y/N':                                 ('operational',      safe_str),
            'PRICE PAID IN PESO':                              ('price_peso',       safe_float),
            'PRICE PAID IN USD':                               ('price_dollar',     safe_float),
            'Date Arrival':                                    ('date_of_arrival',  safe_str),
            'New or Used':                                     ('new_or_used',      safe_str),
        }

        imported_count = 0
        skipped_count = 0

        for _, row in df.iterrows():
            try:
                hardware_data = {}
                for excel_col, (model_attr, converter) in COLUMN_MAPPING.items():
                    if excel_col in df.columns:
                        hardware_data[model_attr] = converter(row[excel_col])

                # Skip completely empty rows (all mapped fields are None)
                if all(v is None for v in hardware_data.values()):
                    skipped_count += 1
                    continue

                # Skip rows with no identifying information at all
                ckt = hardware_data.get('ckt_item_number')
                serial = hardware_data.get('serial_number')
                if not ckt and not serial:
                    skipped_count += 1
                    continue

                # Duplicate detection: prefer Serial #, fall back to CKT Item #
                if serial:
                    existing = db.query(models.Hardware).filter(
                        models.Hardware.serial_number == serial
                    ).first()
                    if existing:
                        skipped_count += 1
                        continue
                elif ckt:
                    # No serial — check by CKT item number + hardware type to avoid duplicates
                    hw_type = hardware_data.get('hardware_type')
                    existing = db.query(models.Hardware).filter(
                        models.Hardware.ckt_item_number == ckt,
                        models.Hardware.hardware_type == hw_type,
                        models.Hardware.serial_number == None
                    ).first()
                    if existing:
                        skipped_count += 1
                        continue

                new_hardware = models.Hardware(**hardware_data)
                db.add(new_hardware)
                db.commit()
                imported_count += 1
            except Exception as e:
                db.rollback()
                skipped_count += 1
                continue

        return {"imported": imported_count, "skipped": skipped_count}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing excel file: {str(e)}")

# <-------------------------------------------------Adds hardware to the database ------------------------------------------------->

@app.post("/api/v1/add-hardware", response_model=schemas.Hardware, status_code=201)
def create_hardware(hardware: schemas.HardwareCreate, db: Session = Depends(get_db)):
    db_hardware = models.Hardware(**hardware.dict())
    db.add(db_hardware)
    db.commit()
    db.refresh(db_hardware)
    return db_hardware

# <-------------------------------------------------Displays all hardware in the database ------------------------------------------------->

@app.get("/api/v1/hardware-list", response_model=List[schemas.Hardware])
def read_hardware(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    return (
        db.query(models.Hardware)
        .order_by(models.Hardware.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

# <-------------------------------------------------Displays hardware by id in the database ------------------------------------------------->

@app.get("/api/v1/hardware-by-id/{hardware_id}", response_model=schemas.Hardware)
def read_hardware_by_id(hardware_id: int, db: Session = Depends(get_db)):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")
    return db_hardware

# <-------------------------------------------------Updates hardware in the database ------------------------------------------------->

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

# <-------------------------------------------------Uploads hardware image in the database ------------------------------------------------->

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@app.post("/api/v1/hardware/{hardware_id}/upload-image")
async def upload_hardware_image(hardware_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    import uuid

    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")

    # Define upload path
    upload_dir = "static/images"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    uploaded_paths = []
    for file in files:
        # --- Validate file extension ---
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' has an unsupported extension. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )

        # --- Validate MIME / Content-Type ---
        if file.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' has an unsupported content type '{file.content_type}'."
            )

        # --- Read and enforce size limit ---
        contents = await file.read()
        if len(contents) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' exceeds the 10 MB size limit."
            )

        # --- Build safe, unique filename (no raw user input in path) ---
        safe_name = f"hardware_{hardware_id}_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, safe_name)

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        # Create HardwareImage entry
        db_image = models.HardwareImage(
            hardware_id=hardware_id,
            image_path=f"/static/images/{safe_name}"
        )
        db.add(db_image)
        uploaded_paths.append(db_image.image_path)

    db.commit()

    return {"uploaded_files": uploaded_paths}
