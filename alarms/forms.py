from django import forms
from .models import Alarm


class AlarmForm(forms.ModelForm):
    class Meta:
        model = Alarm
        fields = ['label', 'time', 'repeat_days', 'snooze_minutes']
        widgets = {
            'label': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g. Wake up',
            }),
            'time': forms.TimeInput(
                attrs={'class': 'form-input', 'type': 'time'}
            ),
            'repeat_days': forms.HiddenInput(),
            'snooze_minutes': forms.NumberInput(attrs={
                'class': 'form-input',
                'min': 1,
            }),
        }