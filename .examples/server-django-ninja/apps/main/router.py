from ninja import Router
from django.shortcuts import render
from time import time
from django import get_version as django_version

router = Router(tags=['Main'])

@router.get('/', include_in_schema=False, response=None)
def root_endpoint(request):
    """Welcome page - returns HTML template"""
    context = {
        'django_version': django_version(),
    }
    return render(request, 'main/welcome.html', context)

@router.get('/ping')
def ping(request):
    """API health check endpoint"""
    return {
        'res': 'pong', 
        'version': django_version(), 
        'time': time()
    }