from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

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
    date_created = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    image_objects = relationship("HardwareImage", back_populates="hardware", cascade="all, delete-orphan")

    @property
    def images(self):
        return [img.image_path for img in self.image_objects]

class HardwareImage(Base):
    __tablename__ = "hardware_images"

    id = Column(Integer, primary_key=True, index=True)
    hardware_id = Column(Integer, ForeignKey("hardware_table.id"), nullable=False)
    image_path = Column(String, nullable=False)

    hardware = relationship("Hardware", back_populates="image_objects")
 
