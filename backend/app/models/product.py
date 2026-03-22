from sqlalchemy import Integer, String, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class Product(Base, TimestampMixin):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    article: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units_of_measurement.id"), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(precision=10, scale=2), nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), nullable=False)
    manufacturer_id: Mapped[int] = mapped_column(ForeignKey("manufacturers.id"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.id"), nullable=False)
    discount: Mapped[float] = mapped_column(Numeric(precision=5, scale=2), default=0.0)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="products")
    manufacturer: Mapped["Manufacturer"] = relationship("Manufacturer", back_populates="products")
    category: Mapped["ProductCategory"] = relationship("ProductCategory", back_populates="products")
    units: Mapped["UnitOfMeasurement"] = relationship("UnitOfMeasurement", back_populates="products")
    photos: Mapped[list["ProductPhoto"]] = relationship("ProductPhoto", back_populates="product", cascade="all, delete-orphan")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")

class ProductPhoto(Base, TimestampMixin):
    __tablename__ = "product_photos"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="photos")