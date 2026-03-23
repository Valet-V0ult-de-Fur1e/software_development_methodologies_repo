from typing import Optional
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token
from app.schemas.auth import Token

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def authenticate_user(self, email: str, password: str) -> Optional[Token]:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            return None

        data = {
            "sub": user.email,
            "role": user.role.value
        }
        access_token = create_access_token(data=data)
        return Token(access_token=access_token, token_type="bearer")