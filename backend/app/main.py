from fastapi import FastAPI
from app.api.v1 import router as api_v1_router

app = FastAPI(title="Shoe Store API")

app.include_router(api_v1_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to Shoe Store API"}