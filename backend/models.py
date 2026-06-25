from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


def current_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


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
    screen_size = Column(Integer, nullable=True)
    processor_type = Column(String, nullable=True)
    processor_speed = Column(String, nullable=True)
    operating_system = Column(String, nullable=True)
    ram = Column(Integer, nullable=True)
    hd_type = Column(String, nullable=True)
    hd_storage = Column(String, nullable=True)
    operational = Column(String)  # Using String as requested (Boolean/String)
    price_dollar = Column(Float, nullable=True)
    price_peso = Column(Float, nullable=True)
    date_of_arrival = Column(String, nullable=True)
    new_or_used = Column(String)
    created_at = Column(String, default=current_timestamp)
    updated_at = Column(String, default=current_timestamp, onupdate=current_timestamp)
    image_objects = relationship("HardwareImage", back_populates="hardware", cascade="all, delete-orphan")
    assign_hardware_details = relationship(
        "AssignHardwareDetails",
        back_populates="hardware",
        cascade="all, delete-orphan",
    )

    @property
    def images(self):
        return [img.image_path for img in self.image_objects]

class HardwareImage(Base):
    __tablename__ = "hardware_images"

    id = Column(Integer, primary_key=True, index=True)
    hardware_id = Column(Integer, ForeignKey("hardware_table.id"), nullable=False)
    image_path = Column(String, nullable=False)

    hardware = relationship("Hardware", back_populates="image_objects")

class EmployeeDetails(Base):
    __tablename__ = "employee_details"

    id = Column(Integer, primary_key=True, index=True)
    employee_digit_code = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    contact_number = Column(String, nullable=True)
    position = Column(String, nullable=True)
    department = Column(String, nullable=True)
    date_hired = Column(String, nullable=True)
    status = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(String, default=current_timestamp)
    updated_at = Column(String, default=current_timestamp, onupdate=current_timestamp)
    assign_hardware_details = relationship(
        "AssignHardwareDetails",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    
    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

class AssignHardwareDetails(Base):
    __tablename__ = "assign_hardware_details"
    
    id = Column(Integer, primary_key=True, index=True)
    date_assigned = Column(String, nullable=False)
    date_returned = Column(String, nullable=True)
    status = Column(String, nullable=False)
    history = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(String, default=current_timestamp)
    updated_at = Column(String, default=current_timestamp, onupdate=current_timestamp)

    employee_details_id = Column(Integer, ForeignKey("employee_details.id"), nullable=False)
    hardware_id = Column(Integer, ForeignKey("hardware_table.id"), nullable=False)

    employee = relationship("EmployeeDetails", back_populates="assign_hardware_details")
    hardware = relationship("Hardware", back_populates="assign_hardware_details")
    
    
    
 
