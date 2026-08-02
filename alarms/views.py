from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from django.http import JsonResponse

from .models import Alarm
from .forms import AlarmForm


@login_required
def alarm_list(request):
    alarms = Alarm.objects.filter(user=request.user).order_by('time')
    dial_data = [
        {"time": a.time.strftime('%H:%M'), "is_active": a.is_active}
        for a in alarms
    ]
    return render(request, 'alarms/alarm_list.html', {
        "alarms": alarms,
        "dial_data": dial_data,
    })


def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('alarms:list')
    else:
        form = UserCreationForm()
    return render(request, 'registration/signup.html', {"form": form})


@login_required
def alarm_create(request):
    if request.method == 'POST':
        form = AlarmForm(request.POST)
        if form.is_valid():
            alarm = form.save(commit=False)
            alarm.user = request.user
            alarm.save()
            return redirect('alarms:list')
    else:
        form = AlarmForm()
    return render(request, 'alarms/alarm_form.html', {"form": form})


@login_required
def alarm_edit(request, pk):
    alarm = get_object_or_404(Alarm, pk=pk, user=request.user)
    if request.method == 'POST':
        form = AlarmForm(request.POST, instance=alarm)
        if form.is_valid():
            form.save()
            return redirect('alarms:list')
    else:
        form = AlarmForm(instance=alarm)
    return render(request, 'alarms/alarm_form.html', {"form": form})


@require_POST
@login_required
def alarm_delete(request, pk):
    alarm = get_object_or_404(Alarm, pk=pk, user=request.user)
    alarm.delete()
    return redirect('alarms:list')


@require_POST
@login_required
def alarm_toggle(request, pk):
    try:
        alarm = get_object_or_404(Alarm, pk=pk, user=request.user)
        alarm.is_active = not alarm.is_active
        alarm.save()
        return JsonResponse({"ok": True, "is_active": alarm.is_active})
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)})


@login_required
def api_active_alarms(request):
    alarms = Alarm.objects.filter(user=request.user, is_active=True)
    data = []
    for alarm in alarms:
        data.append({
            "id": alarm.pk,
            "label": alarm.label,
            "time": alarm.time.strftime('%H:%M'),
            "repeat_days": alarm.repeat_days_list,
            "snooze_minutes": alarm.snooze_minutes,
        })
    return JsonResponse({"alarms": data})