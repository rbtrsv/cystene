import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from core.config import settings

from apps.main.router import router as main_router
from apps.accounts.router import router as accounts_router
from apps.cybersecurity.router import router as cybersecurity_router
from apps.cybersecurity.utils.scan_scheduler import start_scan_scheduler, stop_scan_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan — starts background tasks on startup, stops on shutdown.

    Why lifespan over on_event: FastAPI recommends lifespan context manager over
    deprecated @app.on_event("startup")/@app.on_event("shutdown") decorators.
    """
    # Startup — start background schedulers
    scan_scheduler_task = await start_scan_scheduler()

    yield

    # Shutdown — stop background schedulers
    await stop_scan_scheduler(scan_scheduler_task)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
)

# Mount static files
app.mount("/static", StaticFiles(directory="apps/main/static"), name="static")

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
app.include_router(cybersecurity_router)

if __name__ == "__main__":
    uvicorn.run("main:app", port=8003, reload=True)
