import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from core.config import settings

from apps.main.router import router as main_router
from apps.accounts.router import router as accounts_router
from apps.ecommerce.router import router as ecommerce_router
from apps.ecommerce.utils.sync_scheduler import start_sync_scheduler, stop_sync_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan — starts background tasks on startup, stops on shutdown."""
    # Startup — launch sync scheduler background loop
    sync_task = await start_sync_scheduler()
    yield
    # Shutdown — cancel sync scheduler
    await stop_sync_scheduler(sync_task)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
)

# Mount static files — each app owns its own static directory
app.mount("/static", StaticFiles(directory="apps/main/static"), name="static")
app.mount("/ecommerce/static", StaticFiles(directory="apps/ecommerce/static"), name="ecommerce-static")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(',')],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(main_router)
app.include_router(accounts_router)
app.include_router(ecommerce_router)

if __name__ == "__main__":
    uvicorn.run("main:app", port=8003, reload=True)
