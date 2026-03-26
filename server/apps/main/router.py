from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from time import time
import sys

# ==========================================
# Main Router
# ==========================================

router = APIRouter(tags=["Main"])

# Template setup
templates = Jinja2Templates(directory="apps/main/templates")

@router.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root_endpoint(request: Request):
    """Welcome page - returns HTML template"""
    context = {
        "request": request,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "fastapi_version": "0.116.1",
    }
    return templates.TemplateResponse("welcome.html", context)

@router.get("/ping")
async def ping():
    """API health check endpoint"""
    return {
        "res": "pong",
        "version": f"Python {sys.version_info.major}.{sys.version_info.minor}",
        "time": time()
    }