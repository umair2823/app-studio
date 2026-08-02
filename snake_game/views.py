import json

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from .models import HighScore


def game_view(request):
    """
    Renders the actual game page. This is a normal Django view — nothing
    special happens here. The template contains the <canvas> and links to
    our JS/CSS files. All the game logic runs client-side after this.
    """
    return render(request, "snake_game/game.html")


@require_http_methods(["POST"])
def save_score(request):
    """
    Called by JavaScript (via fetch) when the player dies.

    Expects a JSON body like: {"player_name": "Ali", "score": 120}

    Why POST, not GET?
    GET is for "give me data". POST is for "here's data, do something with it
    (create/change something)". We're creating a new HighScore row, so POST
    is the correct verb.

    Why require_http_methods(["POST"])?
    So nobody can trigger this by just visiting the URL in a browser (which
    would be a GET request) — it forces the correct HTTP method.
    """
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    player_name = str(data.get("player_name", "Anonymous")).strip()[:30] or "Anonymous"
    score = data.get("score", 0)

    # Basic server-side validation — NEVER trust data coming from the browser.
    # A user could open dev tools and send score: 999999 directly to this
    # endpoint without even playing. In a real production app you'd want
    # extra protection here (e.g. signed scores, rate limiting). For now,
    # we just make sure it's a sane non-negative integer.
    try:
        score = int(score)
        if score < 0:
            score = 0
    except (ValueError, TypeError):
        score = 0

    entry = HighScore.objects.create(player_name=player_name, score=score)

    return JsonResponse({
        "success": True,
        "id": entry.id,
        "player_name": entry.player_name,
        "score": entry.score,
    })


def leaderboard(request):
    """
    Returns the top 10 scores as JSON. Called by JavaScript to display
    the leaderboard table. This is a GET endpoint because we're only
    reading data, not changing anything.
    """
    top_scores = HighScore.objects.all()[:10]  # Meta.ordering already sorts by -score
    data = [
        {"player_name": s.player_name, "score": s.score}
        for s in top_scores
    ]
    return JsonResponse({"scores": data})
