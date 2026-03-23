from pydantic import BaseModel
from datetime import datetime

class ProductCategoryBase(BaseModel):
    name: str

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryUpdate(BaseModel):
    name: str

class ProductCategoryResponse(ProductCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True