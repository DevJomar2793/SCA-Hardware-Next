import io
import re
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

import models


EXCEL_HEADER_ROW_INDEX = 2

EXCEL_COLUMN_MAPPING = {
    "CKT Item # / Code": ("ckt_item_number", "str"),
    "Hardware Type": ("hardware_type", "str"),
    "Notes": ("notes", "str"),
    "Date Tested": ("date_tested", "str"),
    "Qty": ("qty", "int"),
    "Manufacturer": ("manufacturer", "str"),
    "Warranty": ("warranty", "str"),
    "Model #": ("model_number", "str"),
    "Serial #": ("serial_number", "str"),
    "Screen\nSize ": ("screen_size", "int"),
    "Processor Type / Screen Type": ("processor_type", "str"),
    "Processor Speed ": ("processor_speed", "str"),
    "Operating\nSystem/Android Version/MAC OS ": ("operating_system", "str"),
    "Ram": ("ram", "int"),
    "HD type": ("hd_type", "str"),
    "HD/STORAGE\nCapacity ": ("hd_storage", "str"),
    "Operational Y/N": ("operational", "str"),
    "PRICE PAID IN PESO": ("price_peso", "float"),
    "PRICE PAID IN USD": ("price_dollar", "float"),
    "Date Arrival": ("date_of_arrival", "str"),
    "New or Used": ("new_or_used", "str"),
}


def is_empty_excel_value(value: Any) -> bool:
    if value is None:
        return True

    try:
        if pd.isna(value):
            return True
    except (TypeError, ValueError):
        return False

    return False


def safe_float(value: Any) -> float | None:
    if is_empty_excel_value(value):
        return None

    if isinstance(value, (int, float)):
        return float(value)

    try:
        cleaned = re.sub(r"[^\d.]", "", str(value))
        return float(cleaned) if cleaned else None
    except (ValueError, TypeError):
        return None


def safe_str(value: Any) -> str | None:
    if is_empty_excel_value(value):
        return None

    string_value = str(value).strip()
    return string_value if string_value and string_value.lower() not in ("nan", "none", "nat") else None


def safe_int(value: Any) -> int | None:
    if is_empty_excel_value(value):
        return None

    try:
        if isinstance(value, (int, float)):
            return int(value)

        match = re.search(r"\d+(?:\.\d+)?", str(value))
        return int(float(match.group(0))) if match else None
    except (ValueError, TypeError):
        return None


CONVERTERS = {
    "float": safe_float,
    "int": safe_int,
    "str": safe_str,
}


def parse_hardware_row(row: pd.Series, columns: pd.Index) -> dict[str, Any]:
    hardware_data: dict[str, Any] = {}

    for excel_column, (model_attr, converter_name) in EXCEL_COLUMN_MAPPING.items():
        if excel_column in columns:
            hardware_data[model_attr] = CONVERTERS[converter_name](row[excel_column])

    return hardware_data


def is_duplicate_hardware(hardware_data: dict[str, Any], db: Session) -> bool:
    ckt_item_number = hardware_data.get("ckt_item_number")
    serial_number = hardware_data.get("serial_number")

    if serial_number:
        return (
            db.query(models.Hardware)
            .filter(models.Hardware.serial_number == serial_number)
            .first()
            is not None
        )

    if ckt_item_number:
        hardware_type = hardware_data.get("hardware_type")
        return (
            db.query(models.Hardware)
            .filter(
                models.Hardware.ckt_item_number == ckt_item_number,
                models.Hardware.hardware_type == hardware_type,
                models.Hardware.serial_number == None,
            )
            .first()
            is not None
        )

    return False


def should_skip_hardware_row(hardware_data: dict[str, Any], db: Session) -> bool:
    if all(value is None for value in hardware_data.values()):
        return True

    if not hardware_data.get("ckt_item_number") and not hardware_data.get("serial_number"):
        return True

    return is_duplicate_hardware(hardware_data, db)


def import_excel_contents(contents: bytes, db: Session) -> dict[str, int]:
    dataframe = pd.read_excel(io.BytesIO(contents), header=EXCEL_HEADER_ROW_INDEX)
    imported_count = 0
    skipped_count = 0

    for _, row in dataframe.iterrows():
        try:
            hardware_data = parse_hardware_row(row, dataframe.columns)

            if should_skip_hardware_row(hardware_data, db):
                skipped_count += 1
                continue

            db.add(models.Hardware(**hardware_data))
            db.commit()
            imported_count += 1
        except Exception:
            db.rollback()
            skipped_count += 1

    return {"imported": imported_count, "skipped": skipped_count}
