import os
import uuid

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

import models
from config import IMAGE_UPLOAD_DIR


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
PUBLIC_IMAGE_PREFIX = "/static/images"


def validate_image_metadata(file: UploadFile) -> str:
    filename = file.filename or ""
    extension = os.path.splitext(filename)[1].lower()

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' has an unsupported extension. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    if file.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' has an unsupported content type '{file.content_type}'.",
        )

    return extension


def validate_image_size(filename: str, contents: bytes) -> None:
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' exceeds the 10 MB size limit.",
        )


def save_hardware_image(hardware_id: int, extension: str, contents: bytes, db: Session) -> str:
    os.makedirs(IMAGE_UPLOAD_DIR, exist_ok=True)
    safe_name = f"hardware_{hardware_id}_{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(IMAGE_UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    image_path = f"{PUBLIC_IMAGE_PREFIX}/{safe_name}"
    db.add(models.HardwareImage(hardware_id=hardware_id, image_path=image_path))
    return image_path
