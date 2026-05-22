(function () {
    "use strict";

    var HIGH_KEY = "willys_game_highscore";

    var canvas = document.getElementById("game-canvas");
    var ctx = canvas.getContext("2d");
    var scoreEl = document.getElementById("game-score");
    var livesEl = document.getElementById("game-lives");
    var highEl = document.getElementById("game-high");
    var startBtn = document.getElementById("game-start");
    var overlay = document.getElementById("game-overlay");
    var overlayTitle = document.getElementById("game-overlay-title");
    var overlayText = document.getElementById("game-overlay-text");
    var wrap = canvas.parentElement;

    var W = 300;
    var H = 400;
    var dpr = 1;

    function resize() {
        var rect = wrap.getBoundingClientRect();
        dpr = window.devicePixelRatio || 1;
        W = rect.width;
        H = rect.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (state) {
            state.playerX = Math.min(Math.max(state.playerX, 40), W - 40);
            state.targetX = Math.min(Math.max(state.targetX, 40), W - 40);
        }
        draw();
    }

    var ITEMS = [
        { emoji: "🍔", score: 10, weight: 28, good: true },
        { emoji: "🍟", score: 5,  weight: 28, good: true },
        { emoji: "🌭", score: 8,  weight: 18, good: true },
        { emoji: "🥤", score: 12, weight: 14, good: true },
        { emoji: "⭐", score: 25, weight: 4,  good: true },
        { emoji: "💣", score: 0,  weight: 14, good: false }
    ];
    var ITEM_TOTAL = ITEMS.reduce(function (s, i) { return s + i.weight; }, 0);

    var state = null;

    function newState() {
        return {
            playerX: W / 2,
            targetX: W / 2,
            score: 0,
            lives: 3,
            items: [],
            particles: [],
            running: false,
            gameOver: false,
            elapsed: 0,
            spawnTimer: 0.5,
            shake: 0,
            lastTime: 0
        };
    }

    function pickItem() {
        var r = Math.random() * ITEM_TOTAL;
        for (var i = 0; i < ITEMS.length; i++) {
            r -= ITEMS[i].weight;
            if (r <= 0) return ITEMS[i];
        }
        return ITEMS[0];
    }

    function spawn() {
        var item = pickItem();
        var x = 30 + Math.random() * (W - 60);
        var baseSpeed = 140 + Math.random() * 60;
        var diff = Math.min(state.elapsed * 6, 220);
        state.items.push({
            x: x,
            y: -32,
            vy: baseSpeed + diff,
            emoji: item.emoji,
            score: item.score,
            good: item.good,
            rot: (Math.random() - 0.5) * 0.4,
            vr: (Math.random() - 0.5) * 1.5,
            size: 30
        });
    }

    function endGame() {
        state.running = false;
        state.gameOver = true;
        var prev = parseInt(localStorage.getItem(HIGH_KEY) || "0", 10);
        var high = Math.max(prev, state.score);
        try { localStorage.setItem(HIGH_KEY, String(high)); } catch (e) {}
        highEl.textContent = high;
        overlayTitle.textContent = "Game Over";
        var msg = "You scored " + state.score + " point" + (state.score === 1 ? "" : "s") + ".";
        if (state.score >= prev && state.score > 0) {
            msg += " 🎉 New high score!";
        }
        overlayText.textContent = msg;
        startBtn.textContent = "Play again";
        overlay.classList.remove("hidden");
    }

    function update(dt) {
        state.elapsed += dt;

        // smooth player movement
        var diff = state.targetX - state.playerX;
        state.playerX += diff * Math.min(dt * 14, 1);

        // shake decay
        if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 4);

        // spawn items
        state.spawnTimer -= dt;
        var interval = Math.max(0.32, 0.95 - state.elapsed * 0.012);
        if (state.spawnTimer <= 0) {
            spawn();
            state.spawnTimer = interval * (0.7 + Math.random() * 0.6);
        }

        // update items
        var plateY = H - 50;
        var plateW = 88;
        var plateH = 18;
        for (var i = state.items.length - 1; i >= 0; i--) {
            var it = state.items[i];
            it.y += it.vy * dt;
            it.rot += it.vr * dt;

            // collision with plate (AABB-ish)
            var catchTop = plateY - plateH / 2 - 6;
            var catchBot = plateY + plateH / 2 + 6;
            if (it.y > catchTop && it.y < catchBot && Math.abs(it.x - state.playerX) < plateW / 2 + 8) {
                if (it.good) {
                    state.score += it.score;
                    pop(it.x, it.y, "+" + it.score, "#16a34a");
                } else {
                    state.lives -= 1;
                    state.shake = 1;
                    pop(it.x, it.y, "-1", "#e31f26");
                    if (state.lives <= 0) {
                        state.items.splice(i, 1);
                        endGame();
                        return;
                    }
                }
                state.items.splice(i, 1);
                continue;
            }

            // missed (off-screen bottom): only good items cost nothing but feel free
            if (it.y > H + 40) {
                state.items.splice(i, 1);
            }
        }

        // update particles
        for (var j = state.particles.length - 1; j >= 0; j--) {
            var p = state.particles[j];
            p.y += p.vy * dt;
            p.alpha -= dt * 1.6;
            if (p.alpha <= 0) state.particles.splice(j, 1);
        }
    }

    function pop(x, y, text, color) {
        state.particles.push({
            x: x, y: y, vy: -70, alpha: 1, text: text, color: color
        });
    }

    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
    }

    function draw() {
        // background
        ctx.clearRect(0, 0, W, H);
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#fff5f5");
        g.addColorStop(1, "#ffffff");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // shake offset
        var sx = 0, sy = 0;
        if (state && state.shake > 0) {
            sx = (Math.random() - 0.5) * state.shake * 6;
            sy = (Math.random() - 0.5) * state.shake * 6;
        }
        ctx.save();
        ctx.translate(sx, sy);

        // floor line
        ctx.fillStyle = "rgba(20,21,26,0.06)";
        ctx.fillRect(0, H - 32, W, 1);

        if (state) {
            // items
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (var i = 0; i < state.items.length; i++) {
                var it = state.items[i];
                ctx.save();
                ctx.translate(it.x, it.y);
                ctx.rotate(it.rot);
                ctx.font = it.size + "px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', serif";
                ctx.fillText(it.emoji, 0, 0);
                ctx.restore();
            }

            // plate
            var plateY = H - 50;
            var plateW = 88;
            var plateH = 18;
            ctx.save();
            ctx.shadowColor = "rgba(227,31,38,0.35)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = "#e31f26";
            roundRect(ctx, state.playerX - plateW / 2, plateY - plateH / 2, plateW, plateH, 9);
            ctx.fill();
            ctx.restore();

            // plate highlight
            ctx.fillStyle = "rgba(255,255,255,0.25)";
            roundRect(ctx, state.playerX - plateW / 2 + 6, plateY - plateH / 2 + 3, plateW - 12, 4, 2);
            ctx.fill();

            // W mark
            ctx.fillStyle = "#fff";
            ctx.font = "bold 11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("W", state.playerX, plateY + 1);

            // particles
            ctx.font = "bold 16px Inter, sans-serif";
            for (var k = 0; k < state.particles.length; k++) {
                var p = state.particles[k];
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.fillText(p.text, p.x, p.y);
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    function updateHud() {
        scoreEl.textContent = state.score;
        var hearts = "";
        for (var i = 0; i < state.lives; i++) hearts += "❤️";
        for (var j = state.lives; j < 3; j++) hearts += "🤍";
        livesEl.textContent = hearts;
    }

    function loop(t) {
        if (!state || !state.running) return;
        if (!state.lastTime) state.lastTime = t;
        var dt = Math.min(0.05, (t - state.lastTime) / 1000);
        state.lastTime = t;
        update(dt);
        draw();
        updateHud();
        requestAnimationFrame(loop);
    }

    function startGame() {
        state = newState();
        state.running = true;
        overlay.classList.add("hidden");
        updateHud();
        requestAnimationFrame(function (t) {
            state.lastTime = t;
            loop(t);
        });
    }

    // ===== Input =====

    function setTargetFromClientX(clientX) {
        if (!state) return;
        var rect = canvas.getBoundingClientRect();
        var x = (clientX - rect.left) * (W / rect.width);
        state.targetX = Math.max(50, Math.min(W - 50, x));
    }

    canvas.addEventListener("mousemove", function (e) { setTargetFromClientX(e.clientX); });
    canvas.addEventListener("touchstart", function (e) {
        if (e.touches.length) setTargetFromClientX(e.touches[0].clientX);
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
        if (e.touches.length) {
            e.preventDefault();
            setTargetFromClientX(e.touches[0].clientX);
        }
    }, { passive: false });

    document.addEventListener("keydown", function (e) {
        if (!state || !state.running) {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onStartClick();
            }
            return;
        }
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
            state.targetX = Math.max(50, state.targetX - 48);
        } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
            state.targetX = Math.min(W - 50, state.targetX + 48);
        }
    });

    function onStartClick() {
        if (state && !state.gameOver && !state.running) {
            // resume from pause
            state.running = true;
            state.lastTime = 0;
            overlay.classList.add("hidden");
            requestAnimationFrame(loop);
        } else {
            startGame();
        }
    }
    startBtn.addEventListener("click", onStartClick);

    // pause when tab hidden
    document.addEventListener("visibilitychange", function () {
        if (document.hidden && state && state.running) {
            state.running = false;
            overlayTitle.textContent = "Paused";
            overlayText.textContent = "Come back to keep playing.";
            startBtn.textContent = "Resume";
            overlay.classList.remove("hidden");
        }
    });

    // ===== Init =====

    window.addEventListener("resize", resize);
    resize();
    highEl.textContent = parseInt(localStorage.getItem(HIGH_KEY) || "0", 10);
})();
