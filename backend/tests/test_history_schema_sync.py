from sqlalchemy import create_engine, inspect, text

from schema_sync import sync_history_schema


def test_history_schema_rebuild_preserves_rows_and_backfills_snapshots(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'history-migration.db'}")
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE hardware_table ("
                "id INTEGER PRIMARY KEY, ckt_item_number VARCHAR, "
                "hardware_type VARCHAR, manufacturer VARCHAR, "
                "model_number VARCHAR, serial_number VARCHAR)"
            )
        )
        connection.execute(
            text(
                "CREATE TABLE employee_details ("
                "id INTEGER PRIMARY KEY, employee_digit_code VARCHAR, "
                "first_name VARCHAR, last_name VARCHAR, position VARCHAR, "
                "department VARCHAR)"
            )
        )
        connection.execute(
            text(
                "CREATE TABLE history_table ("
                "id INTEGER PRIMARY KEY, device_id INTEGER NOT NULL, "
                "employee_id INTEGER NOT NULL, date_assigned VARCHAR NOT NULL, "
                "date_returned VARCHAR, status VARCHAR NOT NULL, history VARCHAR, "
                "notes VARCHAR, created_at VARCHAR, updated_at VARCHAR, "
                "FOREIGN KEY(device_id) REFERENCES hardware_table(id), "
                "FOREIGN KEY(employee_id) REFERENCES employee_details(id))"
            )
        )
        connection.execute(
            text(
                "INSERT INTO hardware_table VALUES "
                "(10, 'CKT-10', 'Laptop', 'Dell', 'Latitude', 'SN-10')"
            )
        )
        connection.execute(
            text(
                "INSERT INTO employee_details VALUES "
                "(20, 'EMP-20', 'Ana', 'Santos', 'Technician', 'IT')"
            )
        )
        connection.execute(
            text(
                "INSERT INTO history_table VALUES "
                "(30, 10, 20, '2026-06-01', '2026-07-01', 'Returned', "
                "'Deployed', 'Good', 'created', 'updated')"
            )
        )

    sync_history_schema(engine)

    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("history_table")}
    assert "assignment_id" in columns
    assert "device_model_number" in columns
    assert inspector.get_foreign_keys("history_table") == []

    with engine.connect() as connection:
        record = connection.execute(
            text(
                "SELECT device_ckt_item_number, device_model_number, "
                "employee_first_name, employee_department "
                "FROM history_table WHERE id = 30"
            )
        ).one()
    assert tuple(record) == ("CKT-10", "Latitude", "Ana", "IT")
