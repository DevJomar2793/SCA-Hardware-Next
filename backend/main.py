from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import models
from config import CORS_ORIGINS, STATIC_DIR
from database import engine
from routers import employees, hardware, images, imports
from schema_sync import sync_employee_details_schema


models.Base.metadata.create_all(bind=engine)
sync_employee_details_schema(engine)

app = FastAPI(title="Hardware Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(imports.router)
app.include_router(employees.router)
app.include_router(hardware.router)
app.include_router(images.router)
