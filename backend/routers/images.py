from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

import models
from database import get_db
from services.images import (
    delete_hardware_image_file,
    save_hardware_image,
    validate_image_metadata,
    validate_image_size,
)


router = APIRouter(prefix="/api/v1", tags=["images"])


@router.post("/hardware/{hardware_id}/upload-image")
async def upload_hardware_image(
    hardware_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")

    uploaded_paths = []
    for file in files:
        extension = validate_image_metadata(file)
        contents = await file.read()
        validate_image_size(file.filename or "", contents)
        uploaded_paths.append(save_hardware_image(hardware_id, extension, contents, db))

    db.commit()
    return {"uploaded_files": uploaded_paths}


@router.delete("/hardware/{hardware_id}/image")
def delete_hardware_image(
    hardware_id: int,
    image_path: str,
    db: Session = Depends(get_db),
):
    db_hardware = db.query(models.Hardware).filter(models.Hardware.id == hardware_id).first()
    if db_hardware is None:
        raise HTTPException(status_code=404, detail="Hardware not found")

    db_image = (
        db.query(models.HardwareImage)
        .filter(
            models.HardwareImage.hardware_id == hardware_id,
            models.HardwareImage.image_path == image_path,
        )
        .first()
    )
    if db_image is None:
        raise HTTPException(status_code=404, detail="Hardware image not found")

    delete_hardware_image_file(db_image.image_path)
    db.delete(db_image)
    db.commit()
    return {"deleted_image": image_path}
