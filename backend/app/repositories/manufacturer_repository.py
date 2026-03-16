from app.models.manufacturer import Manufacturer
from app.repositories.base import BaseRepository

class ManufacturerRepository(BaseRepository[Manufacturer]):
    model = Manufacturer