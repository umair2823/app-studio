from django.urls import path
from . import views

urlpatterns = [
    path("",views.dino_game_view,name="home"),
    path("s/", views.submit_score, name="submit_score"),   # POST here saves a score
    path("s/t/", views.top_scores, name="top_scores"),   # GET here returns leaderboard
]
