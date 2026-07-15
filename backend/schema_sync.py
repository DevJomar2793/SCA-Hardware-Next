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

ASSIGN_HARDWARE_DETAILS_COLUMNS = {
    "employee_details_id": "INTEGER",
    "hardware_id": "INTEGER",
    "date_assigned": "VARCHAR",
    "date_returned": "VARCHAR",
    "status": "VARCHAR",
    "history": "VARCHAR",
    "notes": "VARCHAR",
    "created_at": "VARCHAR",
    "updated_at": "VARCHAR",
}

HISTORY_TABLE_COLUMNS = {
    "assignment_id": "INTEGER",
    "device_id": "INTEGER NOT NULL",
    "employee_id": "INTEGER NOT NULL",
    "date_assigned": "VARCHAR NOT NULL",
    "date_returned": "VARCHAR",
    "status": "VARCHAR NOT NULL",
    "return_reason": "VARCHAR",
    "history": "VARCHAR",
    "notes": "VARCHAR",
    "device_ckt_item_number": "VARCHAR",
    "device_hardware_type": "VARCHAR",
    "device_manufacturer": "VARCHAR",
    "device_model_number": "VARCHAR",
    "device_serial_number": "VARCHAR",
    "employee_digit_code": "VARCHAR",
    "employee_first_name": "VARCHAR",
    "employee_last_name": "VARCHAR",
    "employee_position": "VARCHAR",
    "employee_department": "VARCHAR",
    "created_at": "VARCHAR",
    "updated_at": "VARCHAR",
}


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


def sync_assign_hardware_details_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if "assign_hardware_details" not in inspector.get_table_names():
        with engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE TABLE assign_hardware_details ("
                    "id INTEGER NOT NULL PRIMARY KEY, "
                    "employee_details_id INTEGER NOT NULL, "
                    "hardware_id INTEGER NOT NULL, "
                    "date_assigned VARCHAR NOT NULL, "
                    "date_returned VARCHAR, "
                    "status VARCHAR NOT NULL, "
                    "history VARCHAR, "
                    "notes VARCHAR, "
                    "created_at VARCHAR, "
                    "updated_at VARCHAR, "
                    "FOREIGN KEY(employee_details_id) REFERENCES employee_details (id), "
                    "FOREIGN KEY(hardware_id) REFERENCES hardware_table (id)"
                    ")"
                )
            )
        inspector.clear_cache()

    existing_columns = {
        column["name"]: column
        for column in inspector.get_columns("assign_hardware_details")
    }

    if engine.dialect.name == "sqlite" and _needs_assign_hardware_details_rebuild(
        existing_columns
    ):
        _rebuild_assign_hardware_details_schema(engine, existing_columns)
        inspector.clear_cache()
        existing_columns = {
            column["name"]: column
            for column in inspector.get_columns("assign_hardware_details")
        }

    missing_columns = {
        column_name: column_type
        for column_name, column_type in ASSIGN_HARDWARE_DETAILS_COLUMNS.items()
        if column_name not in existing_columns
    }

    if missing_columns:
        with engine.begin() as connection:
            for column_name, column_type in missing_columns.items():
                connection.execute(
                    text(
                        f"ALTER TABLE assign_hardware_details "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )

    with engine.begin() as connection:
        connection.execute(
            text(
                "UPDATE assign_hardware_details "
                "SET updated_at = created_at "
                "WHERE updated_at IS NULL"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS "
                "ix_assign_hardware_details_employee_details_id "
                "ON assign_hardware_details (employee_details_id)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS "
                "ix_assign_hardware_details_hardware_id "
                "ON assign_hardware_details (hardware_id)"
            )
        )


def sync_history_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if "history_table" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]: column for column in inspector.get_columns("history_table")
    }
    foreign_keys = inspector.get_foreign_keys("history_table")

    if engine.dialect.name == "sqlite" and (
        any(column not in existing_columns for column in HISTORY_TABLE_COLUMNS)
        or bool(foreign_keys)
    ):
        _rebuild_history_schema(engine, existing_columns)
        inspector.clear_cache()
        existing_columns = {
            column["name"]: column
            for column in inspector.get_columns("history_table")
        }

    missing_columns = {
        column_name: column_type
        for column_name, column_type in HISTORY_TABLE_COLUMNS.items()
        if column_name not in existing_columns
    }
    if missing_columns:
        with engine.begin() as connection:
            for column_name, column_type in missing_columns.items():
                connection.execute(
                    text(
                        f"ALTER TABLE history_table "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )

    with engine.begin() as connection:
        connection.execute(
            text(
                "UPDATE history_table SET updated_at = created_at "
                "WHERE updated_at IS NULL"
            )
        )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "ix_history_table_assignment_id "
                "ON history_table (assignment_id)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_history_table_device_id "
                "ON history_table (device_id)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_history_table_employee_id "
                "ON history_table (employee_id)"
            )
        )


def _rebuild_history_schema(engine: Engine, columns: dict) -> None:
    def old_or_null(column_name: str) -> str:
        return f"old.{column_name}" if column_name in columns else "NULL"

    def snapshot_or_source(column_name: str, source_expression: str) -> str:
        if column_name in columns:
            return f"COALESCE(old.{column_name}, {source_expression})"
        return source_expression

    snapshot_expressions = {
        "device_ckt_item_number": snapshot_or_source(
            "device_ckt_item_number", "hardware.ckt_item_number"
        ),
        "device_hardware_type": snapshot_or_source(
            "device_hardware_type", "hardware.hardware_type"
        ),
        "device_manufacturer": snapshot_or_source(
            "device_manufacturer", "hardware.manufacturer"
        ),
        "device_model_number": snapshot_or_source(
            "device_model_number", "hardware.model_number"
        ),
        "device_serial_number": snapshot_or_source(
            "device_serial_number", "hardware.serial_number"
        ),
        "employee_digit_code": snapshot_or_source(
            "employee_digit_code", "employee.employee_digit_code"
        ),
        "employee_first_name": snapshot_or_source(
            "employee_first_name", "employee.first_name"
        ),
        "employee_last_name": snapshot_or_source(
            "employee_last_name", "employee.last_name"
        ),
        "employee_position": snapshot_or_source(
            "employee_position", "employee.position"
        ),
        "employee_department": snapshot_or_source(
            "employee_department", "employee.department"
        ),
    }
    ordered_columns = list(HISTORY_TABLE_COLUMNS)
    select_expressions = {
        column_name: old_or_null(column_name) for column_name in ordered_columns
    }
    select_expressions.update(snapshot_expressions)

    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS history_table_new"))
        connection.execute(
            text(
                "CREATE TABLE history_table_new ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                + ", ".join(
                    f"{column_name} {column_type}"
                    for column_name, column_type in HISTORY_TABLE_COLUMNS.items()
                )
                + ")"
            )
        )
        connection.execute(
            text(
                "INSERT INTO history_table_new (id, "
                + ", ".join(ordered_columns)
                + ") SELECT old.id, "
                + ", ".join(
                    select_expressions[column_name]
                    for column_name in ordered_columns
                )
                + " FROM history_table old "
                "LEFT JOIN hardware_table hardware ON hardware.id = old.device_id "
                "LEFT JOIN employee_details employee ON employee.id = old.employee_id"
            )
        )
        connection.execute(text("DROP TABLE history_table"))
        connection.execute(
            text("ALTER TABLE history_table_new RENAME TO history_table")
        )


def _needs_assign_hardware_details_rebuild(columns: dict) -> bool:
    expected_columns = {"id", *ASSIGN_HARDWARE_DETAILS_COLUMNS.keys()}
    return any(
        column_name not in expected_columns and not column.get("nullable", True)
        for column_name, column in columns.items()
    )


def _rebuild_assign_hardware_details_schema(engine: Engine, columns: dict) -> None:
    def old_column_or_null(column_name: str) -> str:
        return f"old.{column_name}" if column_name in columns else "NULL"

    employee_expr = "NULL"
    if "employee_details_id" in columns:
        employee_expr = "old.employee_details_id"
    elif "employee_digit_code" in columns:
        employee_expr = "employee_details.id"
    if "employee_digit_code" in columns and "employee_details_id" in columns:
        employee_expr = "COALESCE(old.employee_details_id, employee_details.id)"

    history_expr = "old.history" if "history" in columns else "NULL"
    if "logs" in columns and "history" in columns:
        history_expr = "COALESCE(old.history, old.logs)"
    elif "logs" in columns:
        history_expr = "old.logs"

    hardware_expr = old_column_or_null("hardware_id")
    date_assigned_expr = (
        "old.date_assigned" if "date_assigned" in columns else "''"
    )
    date_returned_expr = old_column_or_null("date_returned")
    status_expr = "old.status" if "status" in columns else "'Assigned'"
    notes_expr = old_column_or_null("notes")
    created_at_expr = old_column_or_null("created_at")
    updated_at_expr = old_column_or_null("updated_at")

    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS assign_hardware_details_new"))
        connection.execute(
            text(
                "CREATE TABLE assign_hardware_details_new ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                "employee_details_id INTEGER NOT NULL, "
                "hardware_id INTEGER NOT NULL, "
                "date_assigned VARCHAR NOT NULL, "
                "date_returned VARCHAR, "
                "status VARCHAR NOT NULL, "
                "history VARCHAR, "
                "notes VARCHAR, "
                "created_at VARCHAR, "
                "updated_at VARCHAR, "
                "FOREIGN KEY(employee_details_id) REFERENCES employee_details (id), "
                "FOREIGN KEY(hardware_id) REFERENCES hardware_table (id)"
                ")"
            )
        )

        join_clause = ""
        if "employee_digit_code" in columns:
            join_clause = (
                "LEFT JOIN employee_details "
                "ON employee_details.employee_digit_code = old.employee_digit_code "
            )

        connection.execute(
            text(
                "INSERT INTO assign_hardware_details_new ("
                "id, employee_details_id, hardware_id, date_assigned, "
                "date_returned, status, history, notes, created_at, updated_at"
                ") "
                "SELECT "
                f"old.id, {employee_expr}, {hardware_expr}, {date_assigned_expr}, "
                f"{date_returned_expr}, {status_expr}, {history_expr}, {notes_expr}, "
                f"{created_at_expr}, {updated_at_expr} "
                "FROM assign_hardware_details old "
                f"{join_clause}"
                f"WHERE {employee_expr} IS NOT NULL "
                f"AND {hardware_expr} IS NOT NULL "
                f"AND {date_assigned_expr} IS NOT NULL "
                f"AND {status_expr} IS NOT NULL"
            )
        )
        connection.execute(text("DROP TABLE assign_hardware_details"))
        connection.execute(
            text(
                "ALTER TABLE assign_hardware_details_new "
                "RENAME TO assign_hardware_details"
            )
        )


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
