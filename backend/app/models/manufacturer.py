from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Manufacturer(Base, TimestampMixin):
    __tablename__ = "manufacturers"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=True)
    
    products: Mapped[list["Product"]] = relationship("Product", back_populates="manufacturer")