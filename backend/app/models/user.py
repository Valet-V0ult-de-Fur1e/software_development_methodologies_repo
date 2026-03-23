from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin
from enum import Enum

class UserRole(str, Enum):
    guest = "guest"
    user = "user"
    manager = "manager"
    admin = "admin"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.user)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    middle_name: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user")