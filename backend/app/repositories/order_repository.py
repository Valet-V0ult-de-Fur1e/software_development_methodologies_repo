from typing import List

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.order import Order, OrderItem
from app.repositories.base import BaseRepository

class OrderRepository(BaseRepository[Order]):
    model = Order

    async def get(self, id: int) -> Order | None:
        stmt = select(self.model).options(selectinload(self.model.items)).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(self) -> List[Order]:
        stmt = select(self.model).options(selectinload(self.model.items))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_user(self, user_id: int) -> List[Order]:
        stmt = select(self.model).options(selectinload(self.model.items)).where(self.model.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_status(self, status: str) -> List[Order]:
        stmt = select(self.model).options(selectinload(self.model.items)).where(self.model.status == status)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_order_with_items(self, order_data: dict, items_data: list) -> Order:
        order = Order(**order_data)
        self.session.add(order)
        await self.session.flush()  

        for item in items_data:
            item_obj = OrderItem(order_id=order.id, **item)
            self.session.add(item_obj)

        await self.session.commit()
        await self.session.refresh(order)
        return order