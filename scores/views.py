import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import HighScore
from django.shortcuts import render


# csrf_exempt: Django normally blocks POST requests that don't include a
# CSRF token (a security feature against cross-site attacks). Since our
# game's fetch() call is same-origin JS with no form/token, we disable
# that check here for simplicity. In a real production app you'd instead
# fetch and send the CSRF token properly - worth learning later, but
# skipping it for now keeps this focused on the core flow.from django.shortcuts import render
def dino_game_view(request):
       return render(request, "scores/index.html")
@csrf_exempt
@require_http_methods(["POST"])
def submit_score(request):
    # request.body is the raw JSON text sent by fetch(). We parse it
    # into a Python dict with json.loads().
    data = json.loads(request.body)

    score = data.get("score")
    player_name = data.get("player_name", "guest")

    if score is None:
        return JsonResponse({"error": "score is required"}, status=400)

    # .objects.create() both builds the object AND saves it to the DB
    # in one step (equivalent to HighScore(...).save()).
    entry = HighScore.objects.create(player_name=player_name, score=score)

    return JsonResponse(
        {"id": entry.id, "player_name": entry.player_name, "score": entry.score},
        status=201,
    )


@require_http_methods(["GET"])
def top_scores(request):
    # Thanks to `ordering = ["-score"]` in the model's Meta class,
    # this query already comes back highest-score-first.
    top = HighScore.objects.all()[:10]

    # JsonResponse needs a list of plain dicts, not model objects directly.
    data = [{"player_name": s.player_name, "score": s.score} for s in top]

    return JsonResponse(data, safe=False)  # safe=False because we're returning a list, not a dict
