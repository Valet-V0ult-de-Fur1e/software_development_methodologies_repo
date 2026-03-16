from pydantic import BaseModel
from datetime import datetime

class PickupPointBase(BaseModel):
    postal_code: str
    city: str
    street: str
    house_number: str

class PickupPointCreate(PickupPointBase):
    pass

class PickupPointUpdate(BaseModel):
    postal_code: str
    city: str
    street: str
    house_number: str

class PickupPointResponse(PickupPointBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True