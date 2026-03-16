from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.core.deps import require_any_role
from app.repositories.supplier_repository import SupplierRepository
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.models.user import UserRole
from app.models.supplier import Supplier

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

@router.get("/", response_model=list[SupplierResponse])
async def get_suppliers(
    session: AsyncSession = Depends(get_async_session)
):
    supplier_repo = SupplierRepository(session)
    suppliers = await supplier_repo.list()
    return [SupplierResponse.from_orm(s) for s in suppliers]

@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    supplier_repo = SupplierRepository(session)
    supplier = await supplier_repo.get(supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return SupplierResponse.from_orm(supplier)

@router.post("/", response_model=SupplierResponse)
async def create_supplier(
    supplier_create: SupplierCreate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    supplier_repo = SupplierRepository(session)
    supplier = supplier_create.dict()
    new_supplier = Supplier(**supplier)
    created_supplier = await supplier_repo.create(new_supplier)
    return SupplierResponse.from_orm(created_supplier)

@router.patch("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    supplier_repo = SupplierRepository(session)
    updated_supplier = await supplier_repo.update(supplier_id, supplier_update.dict(exclude_unset=True))
    if not updated_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return SupplierResponse.from_orm(updated_supplier)

@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    supplier_repo = SupplierRepository(session)
    success = await supplier_repo.delete(supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"detail": "Supplier deleted successfully"}