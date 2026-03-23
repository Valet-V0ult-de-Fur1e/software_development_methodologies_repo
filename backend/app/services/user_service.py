from typing import List, Optional
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.models.user import User, UserRole

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def create_user(self, user_create: UserCreate) -> UserResponse:
        user_data = user_create.dict()
        user_data["password_hash"] = get_password_hash(user_create.password)
        del user_data["password"]
        user = User(**user_data)
        created_user = await self.user_repo.create(user)
        return UserResponse.from_orm(created_user)

    async def get_user(self, user_id: int) -> Optional[UserResponse]:
        user = await self.user_repo.get(user_id)
        if user:
            return UserResponse.from_orm(user)
        return None

    async def get_users(self) -> List[UserResponse]:
        users = await self.user_repo.list()
        return [UserResponse.from_orm(u) for u in users]

    async def update_current_user(self, user_id: int, user_update: UserUpdate) -> Optional[UserResponse]:
        user = await self.user_repo.get(user_id)
        if not user:
            return None

        update_data = user_update.dict(exclude_unset=True)
        allowed_fields = {"first_name", "last_name", "middle_name", "email", "password"}
        update_data = {key: value for key, value in update_data.items() if key in allowed_fields}
            
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))

        for key, value in update_data.items():
            setattr(user, key, value)

        await self.user_repo.session.commit()
        await self.user_repo.session.refresh(user)
        return UserResponse.from_orm(user)

    async def update_any_user(self, target_user_id: int, user_update: UserUpdate, updater_role: UserRole) -> Optional[UserResponse]:
        if updater_role != UserRole.admin:
            raise PermissionError("Only admins can update any user.")

        user = await self.user_repo.get(target_user_id)
        if not user:
            return None

        update_data = user_update.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))

        for key, value in update_data.items():
            setattr(user, key, value)

        await self.user_repo.session.commit()
        await self.user_repo.session.refresh(user)
        return UserResponse.from_orm(user)

    async def delete_any_user(self, target_user_id: int, updater_role: UserRole) -> bool:
        if updater_role != UserRole.admin:
            raise PermissionError("Only admins can delete any user.")
        return await self.user_repo.delete(target_user_id)