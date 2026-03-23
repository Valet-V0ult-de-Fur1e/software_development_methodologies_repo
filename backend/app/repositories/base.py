from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.base import Base

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T], ABC):
    model: T

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, id: int) -> Optional[T]:
        stmt = select(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(self) -> List[T]:
        stmt = select(self.model)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, obj: T) -> T:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: int, obj_: dict) -> Optional[T]:
        obj = await self.get(id)
        if obj:
            for key, value in obj_.items():
                setattr(obj, key, value)
            await self.session.commit()
            await self.session.refresh(obj)
        return obj

    async def delete(self, id: int) -> bool:
        obj = await self.get(id)
        if obj:
            await self.session.delete(obj)
            await self.session.commit()
            return True
        return False

    async def filter_and_paginate(
        self,
        filters: Optional[Dict[str, Any]] = None,
        search_query: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        page: int = 1,
        size: int = 10
    ) -> tuple[List[T], int]:
        stmt = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)

        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field):
                    stmt = stmt.where(getattr(self.model, field) == value)
                    count_stmt = count_stmt.where(getattr(self.model, field) == value)

        if search_query and search_fields:
            search_conditions = []
            for field_name in search_fields:
                if hasattr(self.model, field_name):
                    attr = getattr(self.model, field_name)
                    search_conditions.append(attr.contains(search_query))

            if search_conditions:
                combined_condition = search_conditions[0]
                for condition in search_conditions[1:]:
                    combined_condition = combined_condition | condition
                stmt = stmt.where(combined_condition)
                count_stmt = count_stmt.where(combined_condition)

        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        result = await self.session.execute(stmt)
        count_result = await self.session.execute(count_stmt)

        items = result.scalars().all()
        total = count_result.scalar_one()

        return items, total