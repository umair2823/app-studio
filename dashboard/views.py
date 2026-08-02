from django.shortcuts import render

def home(request):
    """Landing page that links the four imported Django apps."""
    return render(request, 'dashboard/home.html')
