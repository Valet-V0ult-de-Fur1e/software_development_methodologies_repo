from pydantic import BaseModel
from datetime import datetime

class UnitOfMeasurementBase(BaseModel):
    name: str

class UnitOfMeasurementCreate(UnitOfMeasurementBase):
    pass

class UnitOfMeasurementUpdate(BaseModel):
    name: str

class UnitOfMeasurementResponse(UnitOfMeasurementBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True