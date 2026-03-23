from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app.repositories.order_repository import OrderRepository
from app.repositories.user_repository import UserRepository
from app.repositories.pickup_point_repository import PickupPointRepository
from app.repositories.product_repository import ProductRepository
from app.models.order import Order, OrderItem
from app.schemas.order import OrderItemCreate
from datetime import datetime
import secrets

class OrderService:
    def __init__(
        self,
        session: AsyncSession,
        order_repo: OrderRepository,
        user_repo: UserRepository,
        pickup_repo: PickupPointRepository,
        product_repo: ProductRepository
    ):
        self.session = session
        self.order_repo = order_repo
        self.user_repo = user_repo
        self.pickup_repo = pickup_repo
        self.product_repo = product_repo

    async def create_order(self, user_id: int, pickup_point_id: int, items: List[OrderItemCreate]) -> Order:
        user = await self.user_repo.get(user_id)
        pickup_point = await self.pickup_repo.get(pickup_point_id)
        if not user or not pickup_point:
            raise ValueError("Invalid user or pickup point ID")

        for item in items:
            product_id = item.product_id
            quantity = item.quantity

            product = await self.product_repo.get(product_id)
            if not product:
                raise ValueError(f"Product with ID {product_id} does not exist")
            if product.stock_quantity < quantity:
                raise ValueError(f"Not enough stock for product {product.name}")

        order_data = {
            "order_number": f"ORD-{int(datetime.now().timestamp())}-{user_id}",
            "date_ordered": datetime.now(),
            "pickup_point_id": pickup_point_id,
            "user_id": user_id,
            "pickup_code": secrets.token_urlsafe(8),
            "status": "pending"
        }

        order = Order(**order_data)
        self.session.add(order)
        await self.session.flush() 
        for item in items:
            product_id = item.product_id
            quantity = item.quantity

            product = await self.product_repo.get(product_id)
            item_obj = OrderItem(
                order_id=order.id,
                product_id=product_id,
                quantity=quantity,
                price_at_order=product.price
            )
            self.session.add(item_obj)

            product.stock_quantity -= quantity

        try:
            await self.session.commit()
            created_order = await self.order_repo.get(order.id)
            if not created_order:
                raise ValueError("Failed to load created order")
            return created_order
        except IntegrityError:
            await self.session.rollback()
            raise ValueError("Failed to create order due to conflict")