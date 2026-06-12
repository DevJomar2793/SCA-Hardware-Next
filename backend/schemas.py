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
    date_created: str
    image_path: Optional[str] = None

class HardwareCreate(HardwareBase):
    pass

class Hardware(HardwareBase):
    id: int

    class Config:
        from_attributes = True
