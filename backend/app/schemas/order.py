from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    price_at_order: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    pickup_point_id: int
    user_id: int

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    pickup_point_id: Optional[int] = None
    status: Optional[OrderStatus] = None

class OrderResponse(OrderBase):
    id: int
    order_number: str
    date_ordered: datetime
    date_delivered: Optional[datetime] = None
    pickup_code: str
    status: OrderStatus
    total_price: float
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True