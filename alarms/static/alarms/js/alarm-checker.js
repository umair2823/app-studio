(function () {
    "use strict";

    const csrftoken = document.querySelector('input[name=csrfmiddlewaretoken]').value;
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let activeAlarms = [];
    let triggeredThisMinute = {};
    let snoozeTimers = {};

    let audioCtx = null;
    let oscNodes = null;
    let unlocked = false;

    function pad(n) { return n.toString().padStart(2, '0'); }

    // ---------- Audio unlock + beep-beep tone ----------
    function unlockAudio() {
        if (unlocked) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            unlocked = true;
        } catch (e) { /* ignore */ }
    }
    document.addEventListener('click', unlockAudio, { once: true });

    function startBeeping() {
        if (!audioCtx) unlockAudio();
        if (!audioCtx) return;
        stopBeeping();

        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        gain.connect(audioCtx.destination);

        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 880;
        osc.connect(gain);
        osc.start();

        const interval = setInterval(function () {
            const t = audioCtx.currentTime;
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.linearRampToValueAtTime(0.0001, t + 0.35);
        }, 500);

        oscNodes = { osc, gain, interval };
    }

    function stopBeeping() {
        if (oscNodes) {
            try { oscNodes.osc.stop(); } catch (e) {}
            clearInterval(oscNodes.interval);
            oscNodes = null;
        }
    }

    // ---------- Toggle switches ----------
    function initToggleSwitches() {
        document.querySelectorAll('[data-action="toggle"]').forEach(function (el) {
            el.addEventListener('change', function () {
                const id = el.getAttribute('data-alarm-id');
                fetch('/' + id + '/toggle/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Content-Type': 'application/json',
                    },
                })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (!data.ok) {
                            console.error('Toggle failed:', data.error);
                            el.checked = !el.checked;
                            return;
                        }
                        el.checked = data.is_active;
                        el.closest('.alarm-card').classList.toggle('disabled', !data.is_active);
                    })
                    .catch(function (err) {
                        console.error('Toggle request error:', err);
                        el.checked = !el.checked;
                    });
            });
        });
    }

    // ---------- Fetch active alarms ----------
    function fetchActiveAlarms() {
        fetch('/api/alarms/active/')
            .then(function (res) { return res.json(); })
            .then(function (data) { activeAlarms = data.alarms || []; })
            .catch(function (err) { console.error('Failed to fetch alarms:', err); });
    }

    // ---------- Checking loop ----------
    function checkAlarms() {
        const now = new Date();
        const currentTime = pad(now.getHours()) + ':' + pad(now.getMinutes());
        const currentDay = DAY_NAMES[now.getDay()];

        activeAlarms.forEach(function (alarm) {
            const daysMatch = alarm.repeat_days.length === 0 || alarm.repeat_days.includes(currentDay);
            if (!daysMatch) return;
            if (alarm.time !== currentTime) return;
            if (triggeredThisMinute[alarm.id] === currentTime) return;
            triggeredThisMinute[alarm.id] = currentTime;
            triggerAlarm(alarm);
        });
    }

    // ---------- Trigger / Snooze / Dismiss ----------
    function triggerAlarm(alarm) {
        startBeeping();

        const overlay = document.getElementById('alarm-banner');
        const ringTime = document.getElementById('ringTime');
        const ringLabel = document.getElementById('ringLabel');
        if (!overlay) return;

        const parts = alarm.time.split(':');
        ringTime.textContent = parts[0] + ':' + parts[1];
        ringLabel.textContent = alarm.label || 'Alarm';
        overlay.classList.add('show');
        overlay.dataset.currentAlarmId = alarm.id;
    }

    function stopRing() {
        const overlay = document.getElementById('alarm-banner');
        stopBeeping();
        overlay.classList.remove('show');
    }

    function initRingButtons() {
        const overlay = document.getElementById('alarm-banner');
        document.getElementById('dismissBtn').addEventListener('click', stopRing);
        document.getElementById('snoozeBtn').addEventListener('click', function () {
            const id = overlay.dataset.currentAlarmId;
            const alarm = activeAlarms.find(function (a) { return String(a.id) === String(id); });
            stopRing();
            if (!alarm) return;
            if (snoozeTimers[alarm.id]) clearTimeout(snoozeTimers[alarm.id]);
            snoozeTimers[alarm.id] = setTimeout(function () {
                delete triggeredThisMinute[alarm.id];
                triggerAlarm(alarm);
            }, alarm.snooze_minutes * 60 * 1000);
        });
    }

    // ---------- Dial + live clock ----------
    function renderDial() {
        const svg = document.getElementById('dialSvg');
        if (!svg) return;
        const dataEl = document.getElementById('dial-data');
        const dialData = dataEl ? JSON.parse(dataEl.textContent) : [];

        const cx = 150, cy = 150, r = 118;
        let markup = '';
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * 360 - 90;
            const rad = angle * Math.PI / 180;
            const isMajor = i % 6 === 0;
            const outer = isMajor ? r : r - 2;
            const inner = isMajor ? r - 12 : r - 7;
            const x1 = cx + outer * Math.cos(rad), y1 = cy + outer * Math.sin(rad);
            const x2 = cx + inner * Math.cos(rad), y2 = cy + inner * Math.sin(rad);
            markup += '<line class="tick' + (isMajor ? ' major' : '') + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
            if (isMajor) {
                const lx = cx + (r - 24) * Math.cos(rad), ly = cy + (r - 24) * Math.sin(rad);
                markup += '<text class="dial-hour-label" x="' + lx + '" y="' + (ly + 3) + '" text-anchor="middle">' + pad(i) + '</text>';
            }
        }
        dialData.forEach(function (a) {
            const parts = a.time.split(':').map(Number);
            const frac = (parts[0] * 60 + parts[1]) / 1440;
            const angle = frac * 360 - 90;
            const rad = angle * Math.PI / 180;
            const dr = r - 12;
            const x = cx + dr * Math.cos(rad), y = cy + dr * Math.sin(rad);
            markup += '<circle class="alarm-dot' + (a.is_active ? ' active' : '') + '" cx="' + x + '" cy="' + y + '" r="5"></circle>';
        });
        svg.innerHTML = markup + '<line class="hand" id="handLine" x1="150" y1="150" x2="150" y2="40"/><circle class="hub" cx="150" cy="150" r="4"/>';
    }

    function updateHand(now) {
        const hand = document.getElementById('handLine');
        if (!hand) return;
        const cx = 150, cy = 150, r = 100;
        const frac = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
        const angle = frac * 360 - 90;
        const rad = angle * Math.PI / 180;
        hand.setAttribute('x2', cx + r * Math.cos(rad));
        hand.setAttribute('y2', cy + r * Math.sin(rad));
    }

    function tick() {
        const now = new Date();
        const clockTime = document.getElementById('clockTime');
        const clockAmpm = document.getElementById('clockAmpm');
        const dateLabel = document.getElementById('dateLabel');
        if (clockTime) {
            let h = now.getHours() % 12; if (h === 0) h = 12;
            clockTime.innerHTML = h + ':' + pad(now.getMinutes()) +
                '<span class="sec">' + pad(now.getSeconds()) + '</span>';
        }
        if (clockAmpm) clockAmpm.textContent = now.getHours() < 12 ? 'AM' : 'PM';
        if (dateLabel) {
            dateLabel.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        }
        updateHand(now);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initToggleSwitches();
        if (document.getElementById('alarm-banner')) initRingButtons();

        renderDial();
        tick();
        setInterval(tick, 1000);

        fetchActiveAlarms();
        setInterval(checkAlarms, 1000);
        setInterval(fetchActiveAlarms, 60000);
    });
})();