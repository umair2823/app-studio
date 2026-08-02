from django.urls import path

from . import views

app_name = "snake_game"

urlpatterns = [
    path("", views.game_view, name="game"),
    path("api/save-score/", views.save_score, name="save_score"),
    path("api/leaderboard/", views.leaderboard, name="leaderboard"),
]
