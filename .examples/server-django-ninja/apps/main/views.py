import django
from django.shortcuts import render

def welcome_view(request):
    context = {
        'django_version': django.get_version()
    }
    return render(request, 'main/welcome.html', context)
