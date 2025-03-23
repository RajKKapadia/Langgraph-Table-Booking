from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes import health_route
from src.routes import agent_route
from src import config

app = FastAPI(
    title="Table Booking Agent",
    description="AI agent to handle reservation at businesses.",
    version=config.API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_route.router)
app.include_router(agent_route.router)
