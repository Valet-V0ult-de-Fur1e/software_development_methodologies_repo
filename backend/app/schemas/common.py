from pydantic import BaseModel
from typing import Optional, Any, Dict

class PaginationParams(BaseModel):
    page: int = 1
    size: int = 10

class FilterParams(BaseModel):
    filters: Optional[Dict[str, Any]] = {}

class SearchParams(BaseModel):
    search_query: Optional[str] = None