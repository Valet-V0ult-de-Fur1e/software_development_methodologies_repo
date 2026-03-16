from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, Token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(
    login_request: LoginRequest,
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    auth_service = AuthService(user_repo)
    token = await auth_service.authenticate_user(login_request.email, login_request.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token