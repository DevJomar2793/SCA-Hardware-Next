from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


EMPLOYEE_DETAILS_COLUMNS = {
    "employee_digit_code": "VARCHAR",
    "position": "VARCHAR",
    "date_hired": "VARCHAR",
    "status": "VARCHAR",
    "notes": "VARCHAR",
    "created_at": "VARCHAR",
    "updated_at": "VARCHAR",
}

TEXT_TYPE_MARKERS = ("CHAR", "CLOB", "STRING", "TEXT", "VARCHAR")
INTEGER_TYPE_MARKERS = ("INT",)


def sync_employee_details_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if "employee_details" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]: column for column in inspector.get_columns("employee_details")
    }
    missing_columns = {
        column_name: column_type
        for column_name, column_type in EMPLOYEE_DETAILS_COLUMNS.items()
        if column_name not in existing_columns
    }

    if missing_columns:
        with engine.begin() as connection:
            for column_name, column_type in missing_columns.items():
                connection.execute(
                    text(
                        f"ALTER TABLE employee_details "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )

    with engine.begin() as connection:
        if "date_created" in existing_columns and "created_at" in missing_columns:
            connection.execute(
                text(
                    "UPDATE employee_details "
                    "SET created_at = date_created "
                    "WHERE created_at IS NULL"
                )
            )
        connection.execute(
            text(
                "UPDATE employee_details "
                "SET updated_at = created_at "
                "WHERE updated_at IS NULL"
            )
        )

    inspector.clear_cache()
    updated_columns = {
        column["name"]: column for column in inspector.get_columns("employee_details")
    }

    if engine.dialect.name == "sqlite" and _needs_contact_number_rebuild(updated_columns):
        _rebuild_employee_details_for_text_contact_number(engine)
        inspector.clear_cache()
        updated_columns = {
            column["name"]: column for column in inspector.get_columns("employee_details")
        }

    if "employee_digit_code" in updated_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS "
                    "ix_employee_details_employee_digit_code "
                    "ON employee_details (employee_digit_code)"
                )
            )


def sync_hardware_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if engine.dialect.name != "sqlite" or "hardware_table" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]: column for column in inspector.get_columns("hardware_table")
    }
    hardware_columns = {
        "date_tested": "VARCHAR",
        "created_at": "VARCHAR",
        "updated_at": "VARCHAR",
    }
    missing_columns = {
        column_name: column_type
        for column_name, column_type in hardware_columns.items()
        if column_name not in existing_columns
    }

    if missing_columns:
        with engine.begin() as connection:
            for column_name, column_type in missing_columns.items():
                connection.execute(
                    text(
                        f"ALTER TABLE hardware_table "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )
            if "date_created" in existing_columns and "created_at" in missing_columns:
                connection.execute(
                    text(
                        "UPDATE hardware_table "
                        "SET created_at = date_created "
                        "WHERE created_at IS NULL"
                    )
                )
        inspector.clear_cache()
        existing_columns = {
            column["name"]: column for column in inspector.get_columns("hardware_table")
        }

    with engine.begin() as connection:
        connection.execute(
            text(
                "UPDATE hardware_table "
                "SET updated_at = created_at "
                "WHERE updated_at IS NULL"
            )
        )

    if not (
        any(
            _needs_integer_column_rebuild(existing_columns, column_name)
            for column_name in ("screen_size", "ram")
        )
        or _needs_text_column_rebuild(existing_columns, "hd_storage")
    ):
        return

    _rebuild_hardware_for_integer_specs(engine)


def _needs_integer_column_rebuild(columns: dict, column_name: str) -> bool:
    column = columns.get(column_name)
    if column is None:
        return False

    column_type = str(column["type"]).upper()
    return not any(marker in column_type for marker in INTEGER_TYPE_MARKERS)


def _needs_text_column_rebuild(columns: dict, column_name: str) -> bool:
    column = columns.get(column_name)
    if column is None:
        return False

    column_type = str(column["type"]).upper()
    return not any(marker in column_type for marker in TEXT_TYPE_MARKERS)


def _rebuild_hardware_for_integer_specs(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS hardware_table_new"))
        connection.execute(
            text(
                "CREATE TABLE hardware_table_new ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                "ckt_item_number VARCHAR, "
                "hardware_type VARCHAR, "
                "notes VARCHAR, "
                "date_tested VARCHAR, "
                "qty INTEGER, "
                "manufacturer VARCHAR, "
                "warranty VARCHAR, "
                "model_number VARCHAR, "
                "serial_number VARCHAR, "
                "screen_size INTEGER, "
                "processor_type VARCHAR, "
                "processor_speed VARCHAR, "
                "operating_system VARCHAR, "
                "ram INTEGER, "
                "hd_type VARCHAR, "
                "hd_storage VARCHAR, "
                "operational VARCHAR, "
                "price_dollar FLOAT, "
                "price_peso FLOAT, "
                "date_of_arrival VARCHAR, "
                "new_or_used VARCHAR, "
                "created_at VARCHAR, "
                "updated_at VARCHAR"
                ")"
            )
        )
        connection.execute(
            text(
                "INSERT INTO hardware_table_new ("
                "id, ckt_item_number, hardware_type, notes, date_tested, qty, "
                "manufacturer, warranty, model_number, serial_number, screen_size, "
                "processor_type, processor_speed, operating_system, ram, hd_type, "
                "hd_storage, operational, price_dollar, price_peso, date_of_arrival, "
                "new_or_used, created_at, updated_at"
                ") "
                "SELECT "
                "id, ckt_item_number, hardware_type, notes, date_tested, qty, "
                "manufacturer, warranty, model_number, serial_number, "
                "CAST(NULLIF(screen_size, '') AS INTEGER), processor_type, "
                "processor_speed, operating_system, CAST(NULLIF(ram, '') AS INTEGER), "
                "hd_type, CAST(hd_storage AS TEXT), operational, price_dollar, price_peso, "
                "date_of_arrival, new_or_used, created_at, updated_at "
                "FROM hardware_table"
            )
        )
        connection.execute(text("DROP TABLE hardware_table"))
        connection.execute(text("ALTER TABLE hardware_table_new RENAME TO hardware_table"))
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_hardware_table_id ON hardware_table (id)")
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_hardware_table_ckt_item_number "
                "ON hardware_table (ckt_item_number)"
            )
        )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_hardware_table_serial_number "
                "ON hardware_table (serial_number)"
            )
        )


def _needs_contact_number_rebuild(columns: dict) -> bool:
    contact_number = columns.get("contact_number")
    if contact_number is None:
        return False

    column_type = str(contact_number["type"]).upper()
    return not any(marker in column_type for marker in TEXT_TYPE_MARKERS)


def _rebuild_employee_details_for_text_contact_number(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS employee_details_new"))
        connection.execute(
            text(
                "CREATE TABLE employee_details_new ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                "employee_digit_code VARCHAR, "
                "first_name VARCHAR NOT NULL, "
                "last_name VARCHAR NOT NULL, "
                "contact_number VARCHAR, "
                "position VARCHAR, "
                "department VARCHAR, "
                "date_hired VARCHAR, "
                "status VARCHAR, "
                "notes VARCHAR, "
                "created_at VARCHAR, "
                "updated_at VARCHAR"
                ")"
            )
        )
        connection.execute(
            text(
                "INSERT INTO employee_details_new ("
                "id, employee_digit_code, first_name, last_name, contact_number, "
                "position, department, date_hired, status, notes, created_at, updated_at"
                ") "
                "SELECT "
                "id, employee_digit_code, first_name, last_name, "
                "CAST(contact_number AS TEXT), position, department, date_hired, "
                "status, notes, created_at, updated_at "
                "FROM employee_details"
            )
        )
        connection.execute(text("DROP TABLE employee_details"))
        connection.execute(
            text("ALTER TABLE employee_details_new RENAME TO employee_details")
        )
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_employee_details_id ON employee_details (id)")
        )
