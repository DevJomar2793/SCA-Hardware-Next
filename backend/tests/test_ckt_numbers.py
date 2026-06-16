import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
from ckt_numbers import generate_next_ckt_number
from database import Base


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_generate_next_ckt_number_uses_highest_existing_suffix(db_session):
    db_session.add(models.Hardware(ckt_item_number="L0007", hardware_type="LAPTOP"))
    db_session.add(models.Hardware(ckt_item_number="L0002", hardware_type="LAPTOP"))
    db_session.commit()

    assert generate_next_ckt_number("LAPTOP", db_session) == "L0008"


def test_generate_next_ckt_number_rejects_unknown_type(db_session):
    with pytest.raises(HTTPException) as exc_info:
        generate_next_ckt_number("UNKNOWN", db_session)

    assert exc_info.value.status_code == 400
