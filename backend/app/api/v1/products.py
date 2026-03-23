from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_async_session
from app.core.deps import require_any_role
from app.repositories.product_repository import ProductRepository
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.manufacturer_repository import ManufacturerRepository
from app.repositories.product_category_repository import ProductCategoryRepository
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductFilter, ProductListResponse
from app.models.user import UserRole
from typing import List
from app.core.s3_client import upload_file_to_s3
from app.models.product import ProductPhoto
from slugify import slugify

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=ProductListResponse)
async def get_products(
    filters: ProductFilter = Depends(),
    page: int = 1,
    size: int = 10,
    session: AsyncSession = Depends(get_async_session)
):
    product_repo = ProductRepository(session)
    supplier_repo = SupplierRepository(session)
    manufacturer_repo = ManufacturerRepository(session)
    category_repo = ProductCategoryRepository(session)
    product_service = ProductService(session, product_repo, supplier_repo, manufacturer_repo, category_repo)

    return await product_service.get_products_with_filters(filters, page, size)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    product_repo = ProductRepository(session)
    product = await product_repo.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.from_orm(product)

@router.post("/", response_model=ProductResponse)
async def create_product(
    product_create: ProductCreate,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    product_repo = ProductRepository(session)
    supplier_repo = SupplierRepository(session)
    manufacturer_repo = ManufacturerRepository(session)
    category_repo = ProductCategoryRepository(session)
    product_service = ProductService(session, product_repo, supplier_repo, manufacturer_repo, category_repo)

    try:
        return await product_service.create_product(product_create)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate = None,
    new_photos: List[UploadFile] = File(None),
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    product_repo = ProductRepository(session)
    product = await product_repo.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_photo_bytes_list = []
    if new_photos:
        for photo in new_photos:
            contents = await photo.read()
            new_photo_bytes_list.append(contents)

    updated_product = await product_repo.update(product_id, product_update.dict(exclude_unset=True) if product_update else {})
    if updated_product and new_photo_bytes_list:
        for photo_bytes in new_photo_bytes_list:
            filename = f"products/{updated_product.id}/{slugify(updated_product.name)}_{len(updated_product.photos)}.jpg"
            if upload_file_to_s3(photo_bytes, filename):
                photo = ProductPhoto(product_id=updated_product.id, filename=filename)
                session.add(photo)
        await session.commit()
        await session.refresh(updated_product)

    return ProductResponse.from_orm(updated_product)


@router.post("/{product_id}/photos", response_model=ProductResponse)
async def upload_product_photos(
    product_id: int,
    photos: List[UploadFile] = File(...),
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    product_repo = ProductRepository(session)
    product = await product_repo.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    uploaded = 0
    current_count = len(product.photos)
    for index, photo in enumerate(photos):
        contents = await photo.read()
        if not contents:
            continue

        filename = f"products/{product.id}/{slugify(product.name)}_{current_count + index}.jpg"
        if upload_file_to_s3(contents, filename):
            session.add(ProductPhoto(product_id=product.id, filename=filename))
            uploaded += 1

    if uploaded == 0:
        raise HTTPException(status_code=400, detail="No photos were uploaded")

    await session.commit()
    refreshed_product = await product_repo.get(product_id)
    if not refreshed_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.from_orm(refreshed_product)


@router.delete("/{product_id}/photos/{photo_id}", response_model=ProductResponse)
async def delete_product_photo(
    product_id: int,
    photo_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    product_repo = ProductRepository(session)
    product = await product_repo.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    stmt = select(ProductPhoto).where(ProductPhoto.id == photo_id, ProductPhoto.product_id == product_id)
    result = await session.execute(stmt)
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    upload_path = photo.filename
    await session.delete(photo)
    await session.commit()

    from app.core.s3_client import delete_file_from_s3

    delete_file_from_s3(upload_path)

    refreshed_product = await product_repo.get(product_id)
    if not refreshed_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.from_orm(refreshed_product)

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: dict = Depends(require_any_role(UserRole.admin, UserRole.manager)),
    session: AsyncSession = Depends(get_async_session)
):
    product_repo = ProductRepository(session)
    success = await product_repo.delete(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"detail": "Product deleted successfully"}

@router.get("/photo/{filename:path}")
async def get_product_photo(filename: str):
    from fastapi.responses import Response
    from app.core.s3_client import download_file_from_s3
    photo_bytes = download_file_from_s3(filename)
    if not photo_bytes:
        raise HTTPException(status_code=404, detail="Photo not found")
    return Response(content=photo_bytes, media_type="image/jpeg")