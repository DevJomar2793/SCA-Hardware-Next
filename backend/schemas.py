from pydantic import BaseModel, field_validator
from typing import Optional, List

class HardwareBase(BaseModel):
    ckt_item_number: Optional[str] = None
    hardware_type: Optional[str] = None
    notes: Optional[str] = None
    date_tested: Optional[str] = None
    qty: Optional[int] = None
    manufacturer: Optional[str] = None
    warranty: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    screen_size: Optional[str] = None
    processor_type: Optional[str] = None
    processor_speed: Optional[str] = None
    operating_system: Optional[str] = None
    ram: Optional[str] = None
    hd_type: Optional[str] = None
    hd_storage: Optional[str] = None
    operational: Optional[str] = None
    price_dollar: Optional[float] = None
    price_peso: Optional[float] = None
    date_of_arrival: Optional[str] = None
    new_or_used: Optional[str] = None

    @field_validator("qty", mode="before")
    @classmethod
    def parse_qty(cls, value):
        if value in (None, "", "-"):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

class HardwareCreate(HardwareBase):
    pass

class HardwareUpdate(BaseModel):
    ckt_item_number: Optional[str] = None
    hardware_type: Optional[str] = None
    notes: Optional[str] = None
    date_tested: Optional[str] = None
    qty: Optional[int] = None
    manufacturer: Optional[str] = None
    warranty: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    screen_size: Optional[str] = None
    processor_type: Optional[str] = None
    processor_speed: Optional[str] = None
    operating_system: Optional[str] = None
    ram: Optional[str] = None
    hd_type: Optional[str] = None
    hd_storage: Optional[str] = None
    operational: Optional[str] = None
    price_dollar: Optional[float] = None
    price_peso: Optional[float] = None
    date_of_arrival: Optional[str] = None
    new_or_used: Optional[str] = None

class Hardware(HardwareBase):
    id: int
    images: List[str] = []
    date_created: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeBase(BaseModel):
    employee_digit_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_number: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    date_hired: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("contact_number", mode="before")
    @classmethod
    def parse_contact_number(cls, value):
        if value in (None, ""):
            return None
        return str(value)


class EmployeeCreate(EmployeeBase):
    employee_digit_code: str
    first_name: str
    last_name: str


class EmployeeUpdate(BaseModel):
    employee_digit_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_number: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    date_hired: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class EmployeeDetails(EmployeeBase):
    id: int
    date_created: Optional[str] = None

    class Config:
        from_attributes = True
