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
            state.playerX = Math.min(Math.max(state.playerX, 50), W - 50);
            state.targetX = Math.min(Math.max(state.targetX, 50), W - 50);
        }
        draw();
    }

    // ===== Item drawing (canvas shapes — no emoji) =====
    // Each drawer assumes caller has translated to item center.

    function drawBurger(c, s) {
        // bottom bun
        c.fillStyle = "#cd8b4a";
        c.beginPath();
        c.ellipse(0, s * 0.32, s * 0.5, s * 0.16, 0, 0, Math.PI * 2);
        c.fill();
        // lettuce
        c.fillStyle = "#7cba47";
        c.beginPath();
        c.moveTo(-s * 0.5, s * 0.16);
        for (var i = 0; i <= 8; i++) {
            var px = -s * 0.5 + (s * 1) * (i / 8);
            var py = s * 0.16 - (i % 2 === 0 ? s * 0.04 : 0);
            c.lineTo(px, py);
        }
        c.lineTo(s * 0.5, s * 0.22);
        c.lineTo(-s * 0.5, s * 0.22);
        c.closePath();
        c.fill();
        // patty
        c.fillStyle = "#5c2f1a";
        c.beginPath();
        c.ellipse(0, s * 0.06, s * 0.48, s * 0.1, 0, 0, Math.PI * 2);
        c.fill();
        // cheese
        c.fillStyle = "#ffc83a";
        c.beginPath();
        c.moveTo(-s * 0.45, s * 0.0);
        c.lineTo(s * 0.45, s * 0.0);
        c.lineTo(s * 0.5, s * 0.08);
        c.lineTo(-s * 0.5, s * 0.08);
        c.closePath();
        c.fill();
        // top bun
        c.fillStyle = "#e6a560";
        c.beginPath();
        c.arc(0, 0, s * 0.5, Math.PI, 0, false);
        c.lineTo(s * 0.5, 0);
        c.lineTo(-s * 0.5, 0);
        c.closePath();
        c.fill();
        // sesame seeds
        c.fillStyle = "#fff8e0";
        var seeds = [-0.22, 0.05, 0.28];
        for (var j = 0; j < seeds.length; j++) {
            c.beginPath();
            c.ellipse(seeds[j] * s, -s * 0.22 + (j === 1 ? s * 0.05 : 0), s * 0.04, s * 0.07, 0, 0, Math.PI * 2);
            c.fill();
        }
    }

    function drawFries(c, s) {
        // fries sticking up
        c.fillStyle = "#ffc83a";
        var sticks = [-0.22, -0.08, 0.06, 0.2];
        for (var i = 0; i < sticks.length; i++) {
            var off = (i % 2 === 0) ? 0 : -s * 0.1;
            c.fillRect(sticks[i] * s, -s * 0.32 + off, s * 0.08, s * 0.42);
        }
        c.fillStyle = "#e6a823";
        for (var k = 0; k < sticks.length; k++) {
            var off2 = (k % 2 === 0) ? 0 : -s * 0.1;
            c.fillRect(sticks[k] * s, -s * 0.32 + off2, s * 0.02, s * 0.42);
        }
        // container
        c.fillStyle = "#e31f26";
        c.beginPath();
        c.moveTo(-s * 0.32, 0);
        c.lineTo(s * 0.32, 0);
        c.lineTo(s * 0.4, s * 0.38);
        c.lineTo(-s * 0.4, s * 0.38);
        c.closePath();
        c.fill();
        // white stripe
        c.fillStyle = "#fff";
        c.fillRect(-s * 0.36, s * 0.08, s * 0.72, s * 0.06);
        // W on container
        c.fillStyle = "#e31f26";
        c.font = "bold " + Math.round(s * 0.1) + "px Inter, sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("W", 0, s * 0.12);
    }

    function drawHotDog(c, s) {
        // bottom bun
        c.fillStyle = "#d49b5e";
        c.beginPath();
        c.ellipse(0, s * 0.08, s * 0.5, s * 0.15, 0, 0, Math.PI * 2);
        c.fill();
        // sausage
        c.fillStyle = "#b0552c";
        c.beginPath();
        c.ellipse(0, -s * 0.02, s * 0.45, s * 0.11, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#8a3e1c";
        c.beginPath();
        c.ellipse(-s * 0.3, -s * 0.04, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(s * 0.3, -s * 0.04, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
        c.fill();
        // top bun
        c.fillStyle = "#e0a86a";
        c.beginPath();
        c.ellipse(0, -s * 0.14, s * 0.5, s * 0.1, 0, 0, Math.PI * 2);
        c.fill();
        // mustard zigzag
        c.strokeStyle = "#ffd33a";
        c.lineWidth = Math.max(2, s * 0.06);
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        c.moveTo(-s * 0.35, -s * 0.02);
        for (var i = 1; i <= 6; i++) {
            c.lineTo(-s * 0.35 + (s * 0.7) * (i / 6), -s * 0.02 + (i % 2 === 0 ? -s * 0.05 : s * 0.05));
        }
        c.stroke();
    }

    function drawDrink(c, s) {
        // straw
        c.fillStyle = "#e31f26";
        c.fillRect(s * 0.06, -s * 0.5, s * 0.06, s * 0.22);
        // lid
        c.fillStyle = "#14151a";
        c.beginPath();
        c.moveTo(-s * 0.32, -s * 0.32);
        c.lineTo(s * 0.32, -s * 0.32);
        c.lineTo(s * 0.3, -s * 0.24);
        c.lineTo(-s * 0.3, -s * 0.24);
        c.closePath();
        c.fill();
        // cup body
        c.fillStyle = "#e31f26";
        c.beginPath();
        c.moveTo(-s * 0.3, -s * 0.24);
        c.lineTo(s * 0.3, -s * 0.24);
        c.lineTo(s * 0.36, s * 0.4);
        c.lineTo(-s * 0.36, s * 0.4);
        c.closePath();
        c.fill();
        // white stripe with W
        c.fillStyle = "#fff";
        c.fillRect(-s * 0.32, -s * 0.06, s * 0.64, s * 0.16);
        c.fillStyle = "#e31f26";
        c.font = "bold " + Math.round(s * 0.14) + "px Inter, sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("W", 0, s * 0.02);
    }

    function drawStar(c, s) {
        c.fillStyle = "#ffd33a";
        c.beginPath();
        var r1 = s * 0.48, r2 = s * 0.22;
        for (var i = 0; i < 10; i++) {
            var ang = -Math.PI / 2 + i * Math.PI / 5;
            var r = (i % 2 === 0) ? r1 : r2;
            var px = Math.cos(ang) * r;
            var py = Math.sin(ang) * r;
            if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.closePath();
        c.fill();
        c.strokeStyle = "#d49600";
        c.lineWidth = 1.5;
        c.stroke();
        // shine
        c.fillStyle = "rgba(255,255,255,0.6)";
        c.beginPath();
        c.ellipse(-s * 0.12, -s * 0.18, s * 0.06, s * 0.1, -0.3, 0, Math.PI * 2);
        c.fill();
    }

    function drawBomb(c, s) {
        // body
        c.fillStyle = "#14151a";
        c.beginPath();
        c.arc(0, s * 0.08, s * 0.42, 0, Math.PI * 2);
        c.fill();
        // highlight
        c.fillStyle = "rgba(255,255,255,0.22)";
        c.beginPath();
        c.arc(-s * 0.14, -s * 0.06, s * 0.1, 0, Math.PI * 2);
        c.fill();
        // fuse base
        c.fillStyle = "#3a3a3f";
        c.fillRect(-s * 0.06, -s * 0.36, s * 0.12, s * 0.06);
        // fuse cord
        c.strokeStyle = "#7a7a80";
        c.lineWidth = Math.max(2, s * 0.05);
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(0, -s * 0.36);
        c.quadraticCurveTo(s * 0.18, -s * 0.46, s * 0.22, -s * 0.58);
        c.stroke();
        // spark glow
        c.fillStyle = "#ffd33a";
        c.beginPath();
        c.arc(s * 0.22, -s * 0.58, s * 0.1, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ff7a1a";
        c.beginPath();
        c.arc(s * 0.22, -s * 0.58, s * 0.06, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#fff5d0";
        c.beginPath();
        c.arc(s * 0.22, -s * 0.58, s * 0.025, 0, Math.PI * 2);
        c.fill();
    }

    var ITEMS = [
        { type: "burger", score: 10, weight: 28, good: true },
        { type: "fries",  score: 5,  weight: 28, good: true },
        { type: "hotdog", score: 8,  weight: 18, good: true },
        { type: "drink",  score: 12, weight: 14, good: true },
        { type: "star",   score: 25, weight: 4,  good: true },
        { type: "bomb",   score: 0,  weight: 14, good: false }
    ];
    var ITEM_TOTAL = ITEMS.reduce(function (s, i) { return s + i.weight; }, 0);

    var DRAWERS = {
        burger: drawBurger,
        fries: drawFries,
        hotdog: drawHotDog,
        drink: drawDrink,
        star: drawStar,
        bomb: drawBomb
    };

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
        var size = 38;
        var x = size / 2 + Math.random() * (W - size);
        var baseSpeed = 140 + Math.random() * 60;
        var diff = Math.min(state.elapsed * 6, 220);
        state.items.push({
            x: x,
            y: -size,
            vy: baseSpeed + diff,
            type: item.type,
            score: item.score,
            good: item.good,
            rot: (Math.random() - 0.5) * 0.3,
            vr: (Math.random() - 0.5) * 1.2,
            size: size
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
        if (state.score > prev && state.score > 0) {
            msg += " New high score!";
        }
        overlayText.textContent = msg;
        startBtn.textContent = "Play again";
        overlay.classList.remove("hidden");
    }

    function update(dt) {
        state.elapsed += dt;

        var diff = state.targetX - state.playerX;
        state.playerX += diff * Math.min(dt * 14, 1);

        if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 4);

        state.spawnTimer -= dt;
        var interval = Math.max(0.32, 0.95 - state.elapsed * 0.012);
        if (state.spawnTimer <= 0) {
            spawn();
            state.spawnTimer = interval * (0.7 + Math.random() * 0.6);
        }

        var plateY = H - 50;
        var plateW = 96;
        var plateH = 20;
        for (var i = state.items.length - 1; i >= 0; i--) {
            var it = state.items[i];
            it.y += it.vy * dt;
            it.rot += it.vr * dt;

            var catchTop = plateY - plateH / 2 - 8;
            var catchBot = plateY + plateH / 2 + 10;
            if (it.y > catchTop && it.y < catchBot && Math.abs(it.x - state.playerX) < plateW / 2 + 12) {
                if (it.good) {
                    state.score += it.score;
                    pop(it.x, it.y, "+" + it.score, "#16a34a");
                } else {
                    state.lives -= 1;
                    state.shake = 1;
                    pop(it.x, it.y, "-1", "#e31f26");
                    if (state.lives <= 0) {
                        state.items.splice(i, 1);
                        updateHud();
                        endGame();
                        return;
                    }
                }
                state.items.splice(i, 1);
                continue;
            }

            if (it.y > H + 50) {
                state.items.splice(i, 1);
            }
        }

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
        ctx.clearRect(0, 0, W, H);
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#fff5f5");
        g.addColorStop(1, "#ffffff");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        var sx = 0, sy = 0;
        if (state && state.shake > 0) {
            sx = (Math.random() - 0.5) * state.shake * 6;
            sy = (Math.random() - 0.5) * state.shake * 6;
        }
        ctx.save();
        ctx.translate(sx, sy);

        ctx.fillStyle = "rgba(20,21,26,0.06)";
        ctx.fillRect(0, H - 32, W, 1);

        if (state) {
            // items
            for (var i = 0; i < state.items.length; i++) {
                var it = state.items[i];
                ctx.save();
                ctx.translate(it.x, it.y);
                ctx.rotate(it.rot);
                var drawer = DRAWERS[it.type];
                if (drawer) drawer(ctx, it.size);
                ctx.restore();
            }

            // plate
            var plateY = H - 50;
            var plateW = 96;
            var plateH = 20;
            ctx.save();
            ctx.shadowColor = "rgba(227,31,38,0.35)";
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 5;
            ctx.fillStyle = "#e31f26";
            roundRect(ctx, state.playerX - plateW / 2, plateY - plateH / 2, plateW, plateH, 10);
            ctx.fill();
            ctx.restore();

            // plate highlight
            ctx.fillStyle = "rgba(255,255,255,0.28)";
            roundRect(ctx, state.playerX - plateW / 2 + 6, plateY - plateH / 2 + 3, plateW - 12, 4, 2);
            ctx.fill();

            // W mark
            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px Inter, sans-serif";
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
        for (var i = 0; i < 3; i++) {
            hearts += (i < state.lives) ? "♥" : "♡";
        }
        livesEl.textContent = hearts;
    }

    function loop(t) {
        if (!state || !state.running) return;
        if (!state.lastTime) state.lastTime = t;
        var dt = Math.min(0.05, (t - state.lastTime) / 1000);
        state.lastTime = t;
        update(dt);
        draw();
        if (state) updateHud();
        if (state && state.running) requestAnimationFrame(loop);
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
