import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

import models

HARDWARE_TYPE_ABBREVIATIONS = {
    "LAPTOP": "L",
    "DESKTOP": "DESK",
    "TABLET": "T",
    "CELLPHONE": "CP",
    "MONITOR": "M",
    "WIRELESS ROUTER": "WR",
    "SWITCH": "SW",
    "AIRCON": "A",
    "EXTERNAL HARD DRIVE": "EHD",
    "HARD DISK DRIVE": "HD",
    "BACKUP HUB": "BH",
    "NETWORK ADAPTER": "NA",
    "PRINTER": "P",
    "KEYBOARD": "KB",
    "MOUSE": "MOU",
    "CRIMPING TOOL": "CT",
    "MOUSE PAD": "MP",
    "CARD READER": "CR",
    "RJ45 CONNECTOR": "RJ",
    "WIRELESS MOUSE": "WM",
    "THERMAL PASTE": "TP",
    "BARCODE SCANNER": "BS",
    "RAM": "RAM",
    "VGA TO HDMI ADAPTER": "VH",
    "WIFI DONGLE": "WD",
    "WIFI EXTENDER": "WE",
    "CAT6 CABLES": "CAT6",
    "5TB ENCLOSURE": "ENC",
    "SOLID STATE DRIVE": "SSD",
    "NVME / M.2 ENCLOSURE": "NV",
    "SATA6 ENCLOSURE": "SSDENC",
    "CCTV": "CCTV",
    "DOOR BELL": "DB",
    "HEATGUN": "HG",
    "TOOL BOX": "TB",
    "SMART WATCH": "SMW",
    "HEADSET": "HS",
    "ASSORTED CHARGERS": "ACH",
    "GRAPHICS CARD": "GPU",
    "TELEPHONE": "TEL",
    "COOLING FAN": "CF",
    "DOCKER": "DOCK",
}


def get_hardware_type_abbreviation(hardware_type: str | None) -> str:
    if not hardware_type:
        raise HTTPException(status_code=400, detail="Hardware type is required.")

    normalized_hardware_type = hardware_type.strip().upper()
    abbreviation = HARDWARE_TYPE_ABBREVIATIONS.get(normalized_hardware_type)
    if abbreviation is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported hardware type: {hardware_type}",
        )

    return abbreviation


def generate_next_ckt_number(hardware_type: str | None, db: Session) -> str:
    abbreviation = get_hardware_type_abbreviation(hardware_type)
    pattern = re.compile(rf"^{re.escape(abbreviation)}(\d+)$")
    highest_number = 0

    existing_numbers = (
        db.query(models.Hardware.ckt_item_number)
        .filter(models.Hardware.ckt_item_number.like(f"{abbreviation}%"))
        .all()
    )

    for (ckt_item_number,) in existing_numbers:
        if not ckt_item_number:
            continue

        match = pattern.match(ckt_item_number)
        if match:
            highest_number = max(highest_number, int(match.group(1)))

    return f"{abbreviation}{highest_number + 1:04d}"
