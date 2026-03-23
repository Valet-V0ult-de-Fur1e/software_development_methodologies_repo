from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import router as api_v1_router
from app.database import engine
from app.models import Base
from app import models as _models  # noqa: F401

app = FastAPI(title="Shoe Store API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api")


@app.on_event("startup")
async def create_tables() -> None:
    # Development safety net: create schema when migration files are absent.
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

@app.get("/")
def root():
    return {"message": "Welcome to Shoe Store API"}