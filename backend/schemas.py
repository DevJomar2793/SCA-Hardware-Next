from pydantic import BaseModel, field_validator
from typing import Any, Optional, List
import re

HARDWARE_TYPES_WITH_REQUIRED_SPECS = {
    "LAPTOP",
    "DESKTOP",
    "TABLET",
    "CELLPHONE",
}

BASE_REQUIRED_HARDWARE_FIELDS = (
    "manufacturer",
    "model_number",
    "serial_number",
    "operational",
    "new_or_used",
    "warranty",
)

SPEC_REQUIRED_HARDWARE_FIELDS = (
    "processor_type",
    "processor_speed",
    "operational",
    "new_or_used",
    "manufacturer",
    "ram",
    "hd_type",
    "hd_storage",
    "operating_system",
    "model_number",
    "serial_number",
    "date_tested",
    "date_of_arrival",
)

HARDWARE_FIELD_LABELS = {
    "processor_type": "Processor",
    "processor_speed": "Speed",
    "operational": "Operational Status",
    "new_or_used": "Condition",
    "manufacturer": "Manufacturer",
    "ram": "RAM",
    "hd_type": "Storage Type",
    "hd_storage": "Storage Capacity",
    "operating_system": "OS",
    "warranty": "Warranty",
    "model_number": "Model Number",
    "serial_number": "Serial Number",
    "date_tested": "Date Tested",
    "date_of_arrival": "Arrival Date",
}

HARDWARE_VALIDATION_FIELDS = (
    "ckt_item_number",
    "hardware_type",
    "notes",
    "date_tested",
    "qty",
    "manufacturer",
    "warranty",
    "model_number",
    "serial_number",
    "screen_size",
    "processor_type",
    "processor_speed",
    "operating_system",
    "ram",
    "hd_type",
    "hd_storage",
    "operational",
    "price_dollar",
    "price_peso",
    "date_of_arrival",
    "new_or_used",
)


def parse_nullable_int(value):
    if value in (None, "", "-"):
        return None

    if isinstance(value, (int, float)):
        return int(value)

    match = re.search(r"\d+(?:\.\d+)?", str(value))
    if not match:
        return None

    try:
        return int(float(match.group(0)))
    except (TypeError, ValueError):
        return None


def required_hardware_fields(hardware_type: str | None):
    if hardware_type in HARDWARE_TYPES_WITH_REQUIRED_SPECS:
        return SPEC_REQUIRED_HARDWARE_FIELDS
    return BASE_REQUIRED_HARDWARE_FIELDS


def is_missing_required_value(value: Any) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def missing_required_hardware_fields(data: dict[str, Any]) -> list[str]:
    return [
        field
        for field in required_hardware_fields(data.get("hardware_type"))
        if is_missing_required_value(data.get(field))
    ]


def missing_required_hardware_message(data: dict[str, Any]) -> str | None:
    missing_fields = missing_required_hardware_fields(data)
    if not missing_fields:
        return None

    labels = [HARDWARE_FIELD_LABELS[field] for field in missing_fields]
    return f"Missing required fields: {', '.join(labels)}."

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
    screen_size: Optional[int] = None
    processor_type: Optional[str] = None
    processor_speed: Optional[str] = None
    operating_system: Optional[str] = None
    ram: Optional[int] = None
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
        return parse_nullable_int(value)

    @field_validator("screen_size", "ram", mode="before")
    @classmethod
    def parse_optional_int(cls, value):
        return parse_nullable_int(value)

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
    screen_size: Optional[int] = None
    processor_type: Optional[str] = None
    processor_speed: Optional[str] = None
    operating_system: Optional[str] = None
    ram: Optional[int] = None
    hd_type: Optional[str] = None
    hd_storage: Optional[str] = None
    operational: Optional[str] = None
    price_dollar: Optional[float] = None
    price_peso: Optional[float] = None
    date_of_arrival: Optional[str] = None
    new_or_used: Optional[str] = None

    @field_validator("screen_size", "ram", mode="before")
    @classmethod
    def parse_optional_int(cls, value):
        return parse_nullable_int(value)

class Hardware(HardwareBase):
    id: int
    images: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class AssignHardwareBase(BaseModel):
    employee_details_id: Optional[int] = None
    hardware_id: Optional[int] = None
    date_assigned: Optional[str] = None
    date_returned: Optional[str] = None
    status: Optional[str] = None
    history: Optional[str] = None
    notes: Optional[str] = None


class AssignHardwareCreate(AssignHardwareBase):
    employee_details_id: int
    hardware_id: int
    date_assigned: str
    status: str = "Assigned"


class AssignHardwareBulkCreate(AssignHardwareBase):
    employee_details_id: int
    hardware_ids: List[int]
    date_assigned: str
    status: str = "Assigned"


class AssignHardwareUpdate(AssignHardwareBase):
    pass


class AssignHardwareDetails(AssignHardwareBase):
    id: int
    employee_details_id: int
    hardware_id: int
    date_assigned: str
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class DeployedHardwareItem(BaseModel):
    assignment: AssignHardwareDetails
    hardware: Hardware
