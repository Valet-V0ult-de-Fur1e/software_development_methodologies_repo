from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.product_repository import ProductRepository
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.manufacturer_repository import ManufacturerRepository
from app.repositories.product_category_repository import ProductCategoryRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse, ProductFilter
from app.models.product import Product, ProductPhoto
from app.core.s3_client import upload_file_to_s3, delete_file_from_s3
from slugify import slugify

class ProductService:
    def __init__(
        self,
        session: AsyncSession,
        product_repo: ProductRepository,
        supplier_repo: SupplierRepository,
        manufacturer_repo: ManufacturerRepository,
        category_repo: ProductCategoryRepository
    ):
        self.session = session
        self.product_repo = product_repo
        self.supplier_repo = supplier_repo
        self.manufacturer_repo = manufacturer_repo
        self.category_repo = category_repo

    async def create_product(self, product_create: ProductCreate, photos: List[bytes] = None) -> ProductResponse:
        supplier = await self.supplier_repo.get(product_create.supplier_id)
        manufacturer = await self.manufacturer_repo.get(product_create.manufacturer_id)
        category = await self.category_repo.get(product_create.category_id)

        if not supplier or not manufacturer or not category:
            raise ValueError("Invalid supplier, manufacturer, or category ID")

        product_data = product_create.dict()
        product = Product(**product_data)
        created_product = await self.product_repo.create(product)
        if photos:
            for photo_bytes in photos:
                filename = f"products/{created_product.id}/{slugify(created_product.name)}_{len(created_product.photos)}.jpg"
                if upload_file_to_s3(photo_bytes, filename):
                    photo = ProductPhoto(product_id=created_product.id, filename=filename)
                    self.session.add(photo)
            await self.session.commit()

        return ProductResponse.from_orm(created_product)

    async def get_product(self, product_id: int) -> Optional[ProductResponse]:
        product = await self.product_repo.get(product_id)
        if product:
            return ProductResponse.from_orm(product)
        return None

    async def get_products_with_filters(
        self,
        filters: ProductFilter,
        page: int = 1,
        size: int = 10
    ) -> ProductListResponse:
        items, total = await self.product_repo.filter_products(
            category_id=filters.category_id,
            supplier_id=filters.supplier_id,
            manufacturer_id=filters.manufacturer_id,
            min_price=filters.min_price,
            max_price=filters.max_price,
            in_stock=filters.in_stock,
            search_query=filters.search_query,
            page=page,
            size=size
        )
        products = [ProductResponse.from_orm(p) for p in items]
        pages = (total // size) + (1 if total % size > 0 else 0)

        return ProductListResponse(
            items=products,
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    async def update_product(self, product_id: int, product_update: ProductUpdate, new_photos: List[bytes] = None) -> Optional[ProductResponse]:
        updated_product = await self.product_repo.update(product_id, product_update.dict(exclude_unset=True))
        if not updated_product:
            return None
        if new_photos:
            for photo_bytes in new_photos:
                filename = f"products/{updated_product.id}/{slugify(updated_product.name)}_{len(updated_product.photos)}.jpg"
                if upload_file_to_s3(photo_bytes, filename):
                    photo = ProductPhoto(product_id=updated_product.id, filename=filename)
                    self.session.add(photo)
            await self.session.commit()

        return ProductResponse.from_orm(updated_product)

    async def delete_product(self, product_id: int) -> bool:
        product = await self.product_repo.get(product_id)
        if not product:
            return False
        for photo in product.photos:
            delete_file_from_s3(photo.filename)

        return await self.product_repo.delete(product_id)