import os
import tempfile


database_file = tempfile.NamedTemporaryFile(
    prefix="ckt-backend-test-",
    suffix=".db",
    delete=False,
)
database_file.close()
os.environ["DATABASE_URL"] = f"sqlite:///{database_file.name}"
