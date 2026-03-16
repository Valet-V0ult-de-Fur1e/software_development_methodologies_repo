from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.core.deps import require_any_role
from app.repositories.pickup_point_repository import PickupPointRepository
from app.schemas.pickup_point import PickupPointCreate, PickupPointUpdate, PickupPointResponse
from app.models.user import UserRole
from app.models.pickup_point import PickupPoint

router = APIRouter(prefix="/pickup-points", tags=["pickup_points"])

@router.get("/", response_model=list[PickupPointResponse])
async def get_pickup_points(
    session: AsyncSession = Depends(get_async_session)
):
    pickup_repo = PickupPointRepository(session)
    pickups = await pickup_repo.list()
    return [PickupPointResponse.from_orm(p) for p in pickups]

@router.get("/{pickup_id}", response_model=PickupPointResponse)
async def get_pickup_point(
    pickup_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    pickup_repo = PickupPointRepository(session)
    pickup = await pickup_repo.get(pickup_id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup point not found")
    return PickupPointResponse.from_orm(pickup)

@router.post("/", response_model=PickupPointResponse)
async def create_pickup_point(
    pickup_create: PickupPointCreate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    pickup_repo = PickupPointRepository(session)
    pickup = pickup_create.dict()
    new_pickup = PickupPoint(**pickup)
    created_pickup = await pickup_repo.create(new_pickup)
    return PickupPointResponse.from_orm(created_pickup)

@router.patch("/{pickup_id}", response_model=PickupPointResponse)
async def update_pickup_point(
    pickup_id: int,
    pickup_update: PickupPointUpdate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    pickup_repo = PickupPointRepository(session)
    updated_pickup = await pickup_repo.update(pickup_id, pickup_update.dict(exclude_unset=True))
    if not updated_pickup:
        raise HTTPException(status_code=404, detail="Pickup point not found")
    return PickupPointResponse.from_orm(updated_pickup)

@router.delete("/{pickup_id}")
async def delete_pickup_point(
    pickup_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    pickup_repo = PickupPointRepository(session)
    success = await pickup_repo.delete(pickup_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pickup point not found")
    return {"detail": "Pickup point deleted successfully"}