from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.core.deps import get_current_user, require_any_role
from app.repositories.order_repository import OrderRepository
from app.repositories.user_repository import UserRepository
from app.repositories.pickup_point_repository import PickupPointRepository
from app.repositories.product_repository import ProductRepository
from app.services.order_service import OrderService
from app.schemas.auth import TokenData
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderItemResponse
from app.models.user import UserRole

router = APIRouter(prefix="/orders", tags=["orders"])


async def serialize_order_response(order_repo: OrderRepository, order_id: int) -> OrderResponse:
    order = await order_repo.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not order.is_valid_pickup_code(order.pickup_code):
        order.regenerate_pickup_code()
        await order_repo.session.commit()
        await order_repo.session.refresh(order)

    items = [
        OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_order=float(item.price_at_order),
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in order.items
    ]

    total_price = float(sum(item.quantity * item.price_at_order for item in order.items))

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        date_ordered=order.date_ordered,
        date_delivered=order.date_delivered,
        pickup_point_id=order.pickup_point_id,
        user_id=order.user_id,
        pickup_code=order.pickup_code,
        status=order.status,
        total_price=total_price,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
    )

@router.get("/", response_model=list[OrderResponse])
async def get_orders(
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    order_repo = OrderRepository(session)
    orders = await order_repo.list()
    return [await serialize_order_response(order_repo, o.id) for o in orders]

@router.get("/my-orders", response_model=list[OrderResponse])
async def get_my_orders(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    order_repo = OrderRepository(session)
    user_repo = UserRepository(session)
    db_user = await user_repo.get_by_email(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    orders = await order_repo.get_by_user(db_user.id)
    return [await serialize_order_response(order_repo, o.id) for o in orders]

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    order_repo = OrderRepository(session)
    user_repo = UserRepository(session)
    db_user = await user_repo.get_by_email(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    order = await order_repo.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != db_user.id and current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    return await serialize_order_response(order_repo, order.id)

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_create: OrderCreate,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    user_repo = UserRepository(session)
    db_user = await user_repo.get_by_email(current_user.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if order_create.user_id != db_user.id:
        raise HTTPException(status_code=403, detail="Cannot create order for another user")

    order_repo = OrderRepository(session)
    pickup_repo = PickupPointRepository(session)
    product_repo = ProductRepository(session)
    order_service = OrderService(session, order_repo, user_repo, pickup_repo, product_repo)

    try:
        new_order = await order_service.create_order(
            user_id=order_create.user_id,
            pickup_point_id=order_create.pickup_point_id,
            items=order_create.items
        )
        return await serialize_order_response(order_repo, new_order.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    order_repo = OrderRepository(session)
    updated_order = await order_repo.update(order_id, order_update.dict(exclude_unset=True))
    if not updated_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await serialize_order_response(order_repo, updated_order.id)

@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    order_repo = OrderRepository(session)
    success = await order_repo.delete(order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"detail": "Order deleted successfully"}