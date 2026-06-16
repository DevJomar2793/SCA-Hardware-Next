from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from services.excel_import import import_excel_contents


router = APIRouter(prefix="/api/v1", tags=["imports"])


@router.post("/import-excel")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

    try:
        contents = await file.read()
        return import_excel_contents(contents, db)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing excel file: {str(exc)}") from exc
