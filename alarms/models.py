from django.conf import settings
from django.db import models


class Alarm(models.Model):
    _ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    _WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    _WEEKEND = ['Sat', 'Sun']

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alarms',
    )
    label = models.CharField(max_length=100, blank=True)
    time = models.TimeField()
    repeat_days = models.CharField(
        max_length=30,
        blank=True,
        help_text="Comma-separated short day names, e.g. 'Mon,Wed,Fri'. Empty = one-time.",
    )
    is_active = models.BooleanField(default=True)
    sound = models.FileField(upload_to='ringtones/', blank=True, null=True)
    snooze_minutes = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label or 'Alarm'} at {self.time}"

    @property
    def repeat_days_list(self):
        if not self.repeat_days:
            return []
        return self.repeat_days.split(',')

    @property
    def repeat_summary(self):
        days = self.repeat_days_list
        if not days:
            return 'Once'
        day_set = set(days)
        if day_set == set(self._ALL_DAYS):
            return 'Every day'
        if day_set == set(self._WEEKDAYS):
            return 'Weekdays'
        if day_set == set(self._WEEKEND):
            return 'Weekends'
        return ', '.join(days)