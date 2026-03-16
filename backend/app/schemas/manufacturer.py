from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ManufacturerBase(BaseModel):
    name: str
    country: Optional[str] = None

class ManufacturerCreate(ManufacturerBase):
    pass

class ManufacturerUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None

class ManufacturerResponse(ManufacturerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True