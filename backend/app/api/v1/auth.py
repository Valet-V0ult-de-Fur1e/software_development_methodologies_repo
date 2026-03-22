from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    register_request: RegisterRequest,
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    existing_user = await user_repo.get_by_email(register_request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    user_service = UserService(user_repo)
    await user_service.create_user(
        UserCreate(
            first_name=register_request.first_name,
            last_name=register_request.last_name,
            middle_name=register_request.middle_name,
            email=register_request.email,
            password=register_request.password,
        )
    )

    auth_service = AuthService(user_repo)
    token = await auth_service.authenticate_user(register_request.email, register_request.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create access token",
        )
    return token

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