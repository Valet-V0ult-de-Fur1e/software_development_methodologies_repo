from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole
from datetime import datetime

class UserBase(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.user

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    id: int
    role: UserRole 
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True