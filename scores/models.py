from django.db import models

# A model = a Python class that Django turns into a database table.
# Each attribute below becomes a COLUMN in that table.
class HighScore(models.Model):
    player_name = models.CharField(max_length=50, default="guest")
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)  # auto-filled when saved

    class Meta:
        ordering = ["-score"]  # highest score first, by default

    def __str__(self):
        return f"{self.player_name}: {self.score}"
from django.db import models

# Create your models here.
