from app.models.pickup_point import PickupPoint
from app.repositories.base import BaseRepository

class PickupPointRepository(BaseRepository[PickupPoint]):
    model = PickupPoint