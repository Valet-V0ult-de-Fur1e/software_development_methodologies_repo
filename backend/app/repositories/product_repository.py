from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.product import Product
from app.repositories.base import BaseRepository

class ProductRepository(BaseRepository[Product]):
    model = Product

    async def get_by_article(self, article: str) -> Product | None:
        stmt = select(self.model).options(selectinload(self.model.photos)).where(self.model.article == article)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_category(self, category_id: int) -> List[Product]:
        stmt = select(self.model).options(selectinload(self.model.photos)).where(self.model.category_id == category_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get(self, id: int) -> Product | None:
        stmt = select(self.model).options(selectinload(self.model.photos)).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(self) -> List[Product]:
        stmt = select(self.model).options(selectinload(self.model.photos))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def filter_products(
        self,
        category_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        manufacturer_id: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        in_stock: Optional[bool] = None,
        search_query: Optional[str] = None,
        page: int = 1,
        size: int = 10
    ) -> Tuple[List[Product], int]:
        stmt = select(self.model).options(selectinload(self.model.photos))
        count_stmt = select(func.count()).select_from(self.model)

        if category_id is not None:
            stmt = stmt.where(self.model.category_id == category_id)
            count_stmt = count_stmt.where(self.model.category_id == category_id)
        if supplier_id is not None:
            stmt = stmt.where(self.model.supplier_id == supplier_id)
            count_stmt = count_stmt.where(self.model.supplier_id == supplier_id)
        if manufacturer_id is not None:
            stmt = stmt.where(self.model.manufacturer_id == manufacturer_id)
            count_stmt = count_stmt.where(self.model.manufacturer_id == manufacturer_id)
        if min_price is not None:
            stmt = stmt.where(self.model.price >= min_price)
            count_stmt = count_stmt.where(self.model.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(self.model.price <= max_price)
            count_stmt = count_stmt.where(self.model.price <= max_price)
        if in_stock is not None:
            stmt = stmt.where(self.model.stock_quantity > 0) if in_stock else stmt.where(self.model.stock_quantity == 0)
            count_stmt = count_stmt.where(self.model.stock_quantity > 0) if in_stock else count_stmt.where(self.model.stock_quantity == 0)
        if search_query:
            stmt = stmt.where(self.model.name.contains(search_query))
            count_stmt = count_stmt.where(self.model.name.contains(search_query))

        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        result = await self.session.execute(stmt)
        count_result = await self.session.execute(count_stmt)

        items = result.scalars().all()
        total = count_result.scalar_one()

        return items, total