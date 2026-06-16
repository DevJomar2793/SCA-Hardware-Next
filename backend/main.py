from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import models
from config import CORS_ORIGINS, STATIC_DIR
from database import engine
from routers import hardware, images, imports


models.Base.metadata.create_all(bind=engine)

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
app.include_router(hardware.router)
app.include_router(images.router)
