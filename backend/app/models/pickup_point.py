from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class PickupPoint(Base, TimestampMixin):
    __tablename__ = "pickup_points"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    postal_code: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str] = mapped_column(String, nullable=False)
    street: Mapped[str] = mapped_column(String, nullable=False)
    house_number: Mapped[str] = mapped_column(String, nullable=False)

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="pickup_point")