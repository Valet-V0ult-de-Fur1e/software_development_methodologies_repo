from app.models.unit_of_measurement import UnitOfMeasurement
from app.repositories.base import BaseRepository

class UnitOfMeasurementRepository(BaseRepository[UnitOfMeasurement]):
    model = UnitOfMeasurement