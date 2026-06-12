from pydantic import BaseModel
from typing import Optional

class HardwareBase(BaseModel):
    ckt_item_number: str
    hardware_type: str
    notes: Optional[str] = None
    date_tested: Optional[str] = None
    qty: int
    manufacturer: str
    warranty: Optional[str] = None
    model_number: str
    serial_number: str
    screen_size: Optional[str] = None
    processor_type: Optional[str] = None
    processor_speed: Optional[str] = None
    operating_system: Optional[str] = None
    ram: Optional[str] = None
    hd_type: Optional[str] = None
    hd_storage: Optional[str] = None
    operational: str
    price_dollar: Optional[float] = None
    price_peso: Optional[float] = None
    date_of_arrival: Optional[str] = None
    new_or_used: str
    image_path: Optional[str] = None

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
    image_path: Optional[str] = None

class Hardware(HardwareBase):
    id: int
    date_created: Optional[str] = None

    class Config:
        from_attributes = True
