from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


EMPLOYEE_DETAILS_COLUMNS = {
    "employee_digit_code": "VARCHAR",
    "position": "VARCHAR",
    "date_hired": "VARCHAR",
    "status": "VARCHAR",
    "notes": "VARCHAR",
    "date_created": "VARCHAR",
}

TEXT_TYPE_MARKERS = ("CHAR", "CLOB", "STRING", "TEXT", "VARCHAR")


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
                "date_created VARCHAR"
                ")"
            )
        )
        connection.execute(
            text(
                "INSERT INTO employee_details_new ("
                "id, employee_digit_code, first_name, last_name, contact_number, "
                "position, department, date_hired, status, notes, date_created"
                ") "
                "SELECT "
                "id, employee_digit_code, first_name, last_name, "
                "CAST(contact_number AS TEXT), position, department, date_hired, "
                "status, notes, date_created "
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
