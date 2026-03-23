from app.models.product_category import ProductCategory
from app.repositories.base import BaseRepository

class ProductCategoryRepository(BaseRepository[ProductCategory]):
    model = ProductCategory