(function () {
    "use strict";

    var STORAGE_KEY = "willys_maintenance_end_time";
    var MIN_SECONDS = 3 * 60;       // 3:00
    var MAX_SECONDS = 3 * 60 + 10;  // 3:10

    var minutesEl = document.getElementById("minutes");
    var secondsEl = document.getElementById("seconds");
    var progressEl = document.getElementById("progress-bar");
    var statusEl = document.getElementById("status-text");

    var session = null;
    var timer = null;
    var reconnecting = false;

    function pad(n) {
        return n < 10 ? "0" + n : "" + n;
    }

    function randomDurationSeconds() {
        return Math.floor(Math.random() * (MAX_SECONDS - MIN_SECONDS + 1)) + MIN_SECONDS;
    }

    function readStored() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed.endTime !== "number" || typeof parsed.totalSeconds !== "number") {
                return null;
            }
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function writeStored(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // ignore storage errors (private mode, quota, etc.)
        }
    }

    function startNewCycle() {
        var totalSeconds = randomDurationSeconds();
        return {
            endTime: Date.now() + totalSeconds * 1000,
            totalSeconds: totalSeconds
        };
    }

    function loadOrStart() {
        var stored = readStored();
        if (stored && stored.endTime > Date.now()) {
            return stored;
        }
        var fresh = startNewCycle();
        writeStored(fresh);
        return fresh;
    }

    function render(remaining) {
        var mins = Math.floor(remaining / 60);
        var secs = remaining % 60;
        minutesEl.textContent = pad(mins);
        secondsEl.textContent = pad(secs);

        var elapsed = session.totalSeconds - remaining;
        var pct = Math.min(100, Math.max(0, (elapsed / session.totalSeconds) * 100));
        progressEl.style.width = pct + "%";

        document.title =
            remaining > 0
                ? "(" + pad(mins) + ":" + pad(secs) + ") Willy's — We'll Be Right Back"
                : "Willy's — Reconnecting...";
    }

    function tick() {
        if (reconnecting) return;

        var remaining = Math.max(0, Math.round((session.endTime - Date.now()) / 1000));
        render(remaining);

        if (remaining <= 0) {
            reconnecting = true;
            statusEl.textContent = "Reconnecting…";
            progressEl.style.width = "100%";
            setTimeout(function () {
                session = startNewCycle();
                writeStored(session);
                statusEl.textContent = "Estimated time remaining";
                render(session.totalSeconds);
                reconnecting = false;
            }, 2000);
        }
    }

    session = loadOrStart();
    render(Math.max(0, Math.round((session.endTime - Date.now()) / 1000)));
    timer = setInterval(tick, 1000);
})();
