from django.urls import path
from . import views

app_name = 'alarms'

urlpatterns = [
    path('', views.alarm_list, name='list'),
    path('signup/', views.signup, name='signup'),
    path('new/', views.alarm_create, name='create'),
    path('<int:pk>/edit/', views.alarm_edit, name='edit'),
    path('<int:pk>/delete/', views.alarm_delete, name='delete'),
    path('<int:pk>/toggle/', views.alarm_toggle, name='toggle'),
    path('api/alarms/active/', views.api_active_alarms, name='api_active'),
]