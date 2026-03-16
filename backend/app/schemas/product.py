from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductPhotoResponse(BaseModel):
    id: int
    filename: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    article: str
    name: str
    unit_id: int
    price: float
    supplier_id: int
    manufacturer_id: int
    category_id: int
    discount: Optional[float] = 0.0
    stock_quantity: int
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    unit_id: Optional[int] = None
    price: Optional[float] = None
    supplier_id: Optional[int] = None
    manufacturer_id: Optional[int] = None
    category_id: Optional[int] = None
    discount: Optional[float] = None
    stock_quantity: Optional[int] = None
    description: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    photos: List[ProductPhotoResponse]

    class Config:
        from_attributes = True
        
class ProductFilter(BaseModel):
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    manufacturer_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None
    search_query: Optional[str] = None

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    size: int
    pages: int

    class Config:
        from_attributes = True