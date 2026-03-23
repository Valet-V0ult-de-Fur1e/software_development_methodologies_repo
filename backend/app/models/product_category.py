from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class ProductCategory(Base, TimestampMixin):
    __tablename__ = "product_categories"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    
    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")