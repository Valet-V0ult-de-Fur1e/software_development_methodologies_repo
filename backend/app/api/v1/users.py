from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.core.deps import get_current_user, require_role
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService
from app.schemas.auth import TokenData
from app.schemas.user import UserUpdate, UserResponse
from app.models.user import UserRole

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    user_service = UserService(user_repo)
    db_user = await user_repo.get_by_email(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    user = await user_service.get_user(db_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    user_service = UserService(user_repo)
    db_user = await user_repo.get_by_email(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await user_service.update_current_user(db_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: int,
    current_user: dict = Depends(require_role(UserRole.admin)),
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    user_service = UserService(user_repo)
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
async def update_any_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: dict = Depends(require_role(UserRole.admin)),
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    user_service = UserService(user_repo)
    updated_user = await user_service.update_any_user(user_id, user_update, current_user.role)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/{user_id}")
async def delete_any_user(
    user_id: int,
    current_user: dict = Depends(require_role(UserRole.admin)),
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    user_service = UserService(user_repo)
    success = await user_service.delete_any_user(user_id, current_user.role)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}