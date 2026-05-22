(function () {
    "use strict";

    var TOTAL_SECONDS = 10 * 60;

    var minutesEl = document.getElementById("minutes");
    var secondsEl = document.getElementById("seconds");
    var progressEl = document.getElementById("progress-bar");
    var statusEl = document.getElementById("status-text");

    function pad(n) {
        return n < 10 ? "0" + n : "" + n;
    }

    function render(remaining) {
        var mins = Math.floor(remaining / 60);
        var secs = remaining % 60;
        minutesEl.textContent = pad(mins);
        secondsEl.textContent = pad(secs);

        var elapsed = TOTAL_SECONDS - remaining;
        var pct = (elapsed / TOTAL_SECONDS) * 100;
        progressEl.style.width = pct + "%";

        document.title =
            remaining > 0
                ? "(" + pad(mins) + ":" + pad(secs) + ") Willy's — We'll Be Right Back"
                : "Willy's — Reconnecting...";
    }

    function finish() {
        statusEl.textContent = "Reconnecting…";
        progressEl.style.width = "100%";
        setTimeout(function () {
            window.location.reload();
        }, 2000);
    }

    var endTime = Date.now() + TOTAL_SECONDS * 1000;
    render(TOTAL_SECONDS);

    var timer = setInterval(function () {
        var remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        render(remaining);
        if (remaining <= 0) {
            clearInterval(timer);
            finish();
        }
    }, 1000);
})();
