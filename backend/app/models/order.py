from sqlalchemy import Integer, String, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.hybrid import hybrid_property
from app.models.base import Base, TimestampMixin
from datetime import datetime
import random
import re
from enum import Enum

class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class Order(Base, TimestampMixin):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    date_ordered: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    date_delivered: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    pickup_point_id: Mapped[int] = mapped_column(ForeignKey("pickup_points.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    pickup_code: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus), default=OrderStatus.pending)

    pickup_point: Mapped["PickupPoint"] = relationship("PickupPoint", back_populates="orders")
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    @hybrid_property
    def total_price(self):
        return float(sum(item.quantity * item.price_at_order for item in self.items))

    @staticmethod
    def generate_pickup_code() -> str:
        return f"{random.randint(100, 999)}"

    @staticmethod
    def is_valid_pickup_code(code: str) -> bool:
        return bool(re.fullmatch(r"\d{3}", str(code)))

    def regenerate_pickup_code(self):
        self.pickup_code = self.generate_pickup_code()

class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_order: Mapped[float] = mapped_column(Numeric(precision=10, scale=2), nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")