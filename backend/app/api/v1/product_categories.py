from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_async_session
from app.core.deps import require_any_role
from app.repositories.product_category_repository import ProductCategoryRepository
from app.schemas.product_category import ProductCategoryCreate, ProductCategoryUpdate, ProductCategoryResponse
from app.models.user import UserRole
from app.models.product_category import ProductCategory

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=list[ProductCategoryResponse])
async def get_categories(
    session: AsyncSession = Depends(get_async_session)
):
    category_repo = ProductCategoryRepository(session)
    categories = await category_repo.list()
    return [ProductCategoryResponse.from_orm(c) for c in categories]

@router.get("/{category_id}", response_model=ProductCategoryResponse)
async def get_category(
    category_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    category_repo = ProductCategoryRepository(session)
    category = await category_repo.get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return ProductCategoryResponse.from_orm(category)

@router.post("/", response_model=ProductCategoryResponse)
async def create_category(
    category_create: ProductCategoryCreate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    category_repo = ProductCategoryRepository(session)
    category = category_create.dict()
    new_category = ProductCategory(**category)
    created_category = await category_repo.create(new_category)
    return ProductCategoryResponse.from_orm(created_category)

@router.patch("/{category_id}", response_model=ProductCategoryResponse)
async def update_category(
    category_id: int,
    category_update: ProductCategoryUpdate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    category_repo = ProductCategoryRepository(session)
    updated_category = await category_repo.update(category_id, category_update.dict(exclude_unset=True))
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return ProductCategoryResponse.from_orm(updated_category)

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    category_repo = ProductCategoryRepository(session)
    success = await category_repo.delete(category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"detail": "Category deleted successfully"}