from fastapi import APIRouter
from app.api.v1 import auth, users, products, suppliers, manufacturers, product_categories, unit_of_measurements, pickup_points, orders

router = APIRouter(prefix="/v1")

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(products.router)
router.include_router(suppliers.router)
router.include_router(manufacturers.router)
router.include_router(product_categories.router)
router.include_router(unit_of_measurements.router)
router.include_router(pickup_points.router)
router.include_router(orders.router)