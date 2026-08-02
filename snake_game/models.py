from django.db import models


class HighScore(models.Model):
    """
    One row = one game played.

    Why store it this way (instead of one row per player updated each time)?
    Because we want a full leaderboard/history, not just "your best score".
    Simpler to reason about, and it's how most arcade leaderboards work.
    """
    player_name = models.CharField(max_length=30)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)  # set automatically on save

    class Meta:
        ordering = ['-score']  # highest score first, by default, everywhere we query this

    def __str__(self):
        return f"{self.player_name} - {self.score}"
