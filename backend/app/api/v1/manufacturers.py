from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.core.deps import require_any_role
from app.repositories.manufacturer_repository import ManufacturerRepository
from app.schemas.manufacturer import ManufacturerCreate, ManufacturerUpdate, ManufacturerResponse
from app.models.user import UserRole
from app.models.manufacturer import Manufacturer

router = APIRouter(prefix="/manufacturers", tags=["manufacturers"])

@router.get("/", response_model=list[ManufacturerResponse])
async def get_manufacturers(
    session: AsyncSession = Depends(get_async_session)
):
    manufacturer_repo = ManufacturerRepository(session)
    manufacturers = await manufacturer_repo.list()
    return [ManufacturerResponse.from_orm(m) for m in manufacturers]

@router.get("/{manufacturer_id}", response_model=ManufacturerResponse)
async def get_manufacturer(
    manufacturer_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    manufacturer_repo = ManufacturerRepository(session)
    manufacturer = await manufacturer_repo.get(manufacturer_id)
    if not manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return ManufacturerResponse.from_orm(manufacturer)

@router.post("/", response_model=ManufacturerResponse)
async def create_manufacturer(
    manufacturer_create: ManufacturerCreate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    manufacturer_repo = ManufacturerRepository(session)
    manufacturer = manufacturer_create.dict()
    new_manufacturer = Manufacturer(**manufacturer)
    created_manufacturer = await manufacturer_repo.create(new_manufacturer)
    return ManufacturerResponse.from_orm(created_manufacturer)

@router.patch("/{manufacturer_id}", response_model=ManufacturerResponse)
async def update_manufacturer(
    manufacturer_id: int,
    manufacturer_update: ManufacturerUpdate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    manufacturer_repo = ManufacturerRepository(session)
    updated_manufacturer = await manufacturer_repo.update(manufacturer_id, manufacturer_update.dict(exclude_unset=True))
    if not updated_manufacturer:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return ManufacturerResponse.from_orm(updated_manufacturer)

@router.delete("/{manufacturer_id}")
async def delete_manufacturer(
    manufacturer_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    manufacturer_repo = ManufacturerRepository(session)
    success = await manufacturer_repo.delete(manufacturer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return {"detail": "Manufacturer deleted successfully"}