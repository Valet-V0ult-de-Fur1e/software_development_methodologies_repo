from pydantic import BaseModel
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str
    role: UserRole

class LoginRequest(BaseModel):
    email: str
    password: str