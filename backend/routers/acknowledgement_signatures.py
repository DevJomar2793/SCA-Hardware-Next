from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db


router = APIRouter(prefix="/api/v1", tags=["acknowledgement signatures"])
SUPPORTED_SIGNATORY_KEY = "prepared_by"


def get_assignment_or_404(assignment_id: int, db: Session):
    assignment = (
        db.query(models.AssignHardwareDetails)
        .filter(models.AssignHardwareDetails.id == assignment_id)
        .first()
    )
    if assignment is None:
        raise HTTPException(status_code=404, detail="Hardware assignment not found")
    return assignment


def validate_signatory_key(signatory_key: str) -> None:
    if signatory_key != SUPPORTED_SIGNATORY_KEY:
        raise HTTPException(status_code=404, detail="Signatory is not supported")


def find_signature(assignment_id: int, signatory_key: str, db: Session):
    return (
        db.query(models.AcknowledgementSignature)
        .filter(
            models.AcknowledgementSignature.assignment_id == assignment_id,
            models.AcknowledgementSignature.signatory_key == signatory_key,
        )
        .first()
    )


@router.get(
    "/assign-hardware/{assignment_id}/acknowledgement-signatures/{signatory_key}",
    response_model=Optional[schemas.AcknowledgementSignature],
)
def read_acknowledgement_signature(
    assignment_id: int,
    signatory_key: str,
    db: Session = Depends(get_db),
):
    validate_signatory_key(signatory_key)
    get_assignment_or_404(assignment_id, db)
    return find_signature(assignment_id, signatory_key, db)


@router.put(
    "/assign-hardware/{assignment_id}/acknowledgement-signatures/{signatory_key}",
    response_model=schemas.AcknowledgementSignature,
)
def save_acknowledgement_signature(
    assignment_id: int,
    signatory_key: str,
    payload: schemas.AcknowledgementSignatureUpsert,
    db: Session = Depends(get_db),
):
    validate_signatory_key(signatory_key)
    get_assignment_or_404(assignment_id, db)
    signature = find_signature(assignment_id, signatory_key, db)

    if signature is None:
        signature = models.AcknowledgementSignature(
            assignment_id=assignment_id,
            signatory_key=signatory_key,
            signature_data=payload.signature_data,
        )
        db.add(signature)
    else:
        signature.signature_data = payload.signature_data
        signature.updated_at = models.current_timestamp()

    db.commit()
    db.refresh(signature)
    return signature


@router.delete(
    "/assign-hardware/{assignment_id}/acknowledgement-signatures/{signatory_key}",
    status_code=204,
)
def delete_acknowledgement_signature(
    assignment_id: int,
    signatory_key: str,
    db: Session = Depends(get_db),
):
    validate_signatory_key(signatory_key)
    get_assignment_or_404(assignment_id, db)
    signature = find_signature(assignment_id, signatory_key, db)
    if signature is None:
        raise HTTPException(status_code=404, detail="Acknowledgement signature not found")

    db.delete(signature)
    db.commit()
    return Response(status_code=204)
