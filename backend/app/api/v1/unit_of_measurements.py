from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.core.deps import require_any_role
from app.repositories.unit_of_measurement_repository import UnitOfMeasurementRepository
from app.schemas.unit_of_measurement import UnitOfMeasurementCreate, UnitOfMeasurementUpdate, UnitOfMeasurementResponse
from app.models.user import UserRole
from app.models.unit_of_measurement import UnitOfMeasurement

router = APIRouter(prefix="/units", tags=["units"])

@router.get("/", response_model=list[UnitOfMeasurementResponse])
async def get_units(
    session: AsyncSession = Depends(get_async_session)
):
    unit_repo = UnitOfMeasurementRepository(session)
    units = await unit_repo.list()
    return [UnitOfMeasurementResponse.from_orm(u) for u in units]

@router.get("/{unit_id}", response_model=UnitOfMeasurementResponse)
async def get_unit(
    unit_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    unit_repo = UnitOfMeasurementRepository(session)
    unit = await unit_repo.get(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return UnitOfMeasurementResponse.from_orm(unit)

@router.post("/", response_model=UnitOfMeasurementResponse)
async def create_unit(
    unit_create: UnitOfMeasurementCreate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    unit_repo = UnitOfMeasurementRepository(session)
    unit = unit_create.dict()
    new_unit = UnitOfMeasurement(**unit)
    created_unit = await unit_repo.create(new_unit)
    return UnitOfMeasurementResponse.from_orm(created_unit)

@router.patch("/{unit_id}", response_model=UnitOfMeasurementResponse)
async def update_unit(
    unit_id: int,
    unit_update: UnitOfMeasurementUpdate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    unit_repo = UnitOfMeasurementRepository(session)
    updated_unit = await unit_repo.update(unit_id, unit_update.dict(exclude_unset=True))
    if not updated_unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return UnitOfMeasurementResponse.from_orm(updated_unit)

@router.delete("/{unit_id}")
async def delete_unit(
    unit_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    unit_repo = UnitOfMeasurementRepository(session)
    success = await unit_repo.delete(unit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"detail": "Unit deleted successfully"}