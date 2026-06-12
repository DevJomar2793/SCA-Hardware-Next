from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base

class Hardware(Base):
    __tablename__ = "hardware_table"

    id = Column(Integer, primary_key=True, index=True)
    ckt_item_number = Column(String, index=True)
    hardware_type = Column(String)
    notes = Column(String, nullable=True)
    date_tested = Column(String, nullable=True)
    qty = Column(Integer)
    manufacturer = Column(String)
    warranty = Column(String, nullable=True)
    model_number = Column(String)
    serial_number = Column(String, unique=True, index=True)
    screen_size = Column(String, nullable=True)
    processor_type = Column(String, nullable=True)
    processor_speed = Column(String, nullable=True)
    operating_system = Column(String, nullable=True)
    ram = Column(String, nullable=True)
    hd_type = Column(String, nullable=True)
    hd_storage = Column(String, nullable=True)
    operational = Column(String)  # Using String as requested (Boolean/String)
    price_dollar = Column(Float, nullable=True)
    price_peso = Column(Float, nullable=True)
    date_of_arrival = Column(String, nullable=True)
    new_or_used = Column(String)
    image_path = Column(String, nullable=True)
    date_created = Column(String)
 
