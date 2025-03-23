from fastapi import APIRouter, status

from src.models.schemas import HealthResponse
from src import config

router = APIRouter(
    prefix=f"/api/{config.API_VERSION}",
    tags=["HOME"]
)


@router.get("/health", response_model=HealthResponse)
async def get_health():
    return HealthResponse(
        message="ALL IS WELL",
        status=status.HTTP_200_OK
    )
