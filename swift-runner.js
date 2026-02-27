(function () {
    'use strict';

    var canvas = document.getElementById('runnerCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 700, H = 450;

    var gameState = 'start'; // start, playing, dead
    var score = 0;
    var highScore = parseInt(localStorage.getItem('swiftRunnerHigh') || '0', 10);
    var animFrameId = null;
    var frameCount = 0;
    var speed = 2;
    var deathMessage = '';
    var distance = 0;

    // Ground
    var GROUND_Y = H - 80;
    var groundOffset = 0;

    // Player
    var player = {
        x: 100,
        y: GROUND_Y,
        w: 30,
        h: 45,
        vy: 0,
        jumping: false,
        grounded: true,
        ducking: false
    };
    var GRAVITY = 0.4;
    var JUMP_VEL = -13;

    // Obstacles
    var obstacles = [];
    var nextObstacleIn = 120;

    // Collectibles
    var collectibles = [];
    var nextCollectIn = 200;

    var ERROR_TYPES = [
        { label: '❌ Build Failed', w: 35, h: 40, color: '#ff3b30' },
        { label: '⚠️ Signing Error', w: 30, h: 50, color: '#ff9500' },
        { label: '🔴 Linker Error', w: 45, h: 30, color: '#ff3b30' },
        { label: '❌ Missing Module', w: 40, h: 35, color: '#ff2d55' },
        { label: '⚠️ Pod Conflict', w: 55, h: 25, color: '#ff9500' },
        { label: '🔴 Memory Leak', w: 30, h: 55, color: '#af52de' }
    ];

    var COLLECT_TYPES = [
        { label: '☕', points: 1 },
        { label: '🍎', points: 2 },
        { label: '⭐', points: 3 },
        { label: '🚀', points: 5 }
    ];

    var DEATH_MESSAGES = [
        '💥 Crashed into a build error!',
        '💀 EXC_BAD_ACCESS',
        '🔥 Fatal: unresolved dependency',
        '⚠️ Segfault in production!'
    ];

    // Clouds / background elements
    var bgElements = [];
    for (var i = 0; i < 6; i++) {
        bgElements.push({
            x: Math.random() * W,
            y: 40 + Math.random() * 100,
            w: 60 + Math.random() * 80,
            speed: 0.2 + Math.random() * 0.3
        });
    }

    function resetGame() {
        player.y = GROUND_Y;
        player.vy = 0;
        player.jumping = false;
        player.grounded = true;
        player.ducking = false;
        obstacles = [];
        collectibles = [];
        score = 0;
        speed = 2;
        frameCount = 0;
        distance = 0;
        nextObstacleIn = 120;
        nextCollectIn = 200;
    }

    // --- Input ---
    canvas.setAttribute('tabindex', '0');
    var keysDown = {};

    canvas.addEventListener('keydown', function (e) {
        keysDown[e.code] = true;
        if (gameState === 'start' || gameState === 'dead') {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                startPlaying();
                return;
            }
        }
        if (gameState !== 'playing') return;
        if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && player.grounded) {
            e.preventDefault();
            player.vy = JUMP_VEL;
            player.jumping = true;
            player.grounded = false;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            e.preventDefault();
            player.ducking = true;
        }
    });

    canvas.addEventListener('keyup', function (e) {
        keysDown[e.code] = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            player.ducking = false;
        }
    });

    canvas.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (gameState === 'start' || gameState === 'dead') {
            startPlaying();
        } else if (gameState === 'playing' && player.grounded) {
            player.vy = JUMP_VEL;
            player.jumping = true;
            player.grounded = false;
        }
    });

    function startPlaying() {
        gameState = 'playing';
        resetGame();
    }

    // --- Update ---
    function update() {
        if (gameState !== 'playing') return;
        frameCount++;
        distance += speed;

        // Gradual speed increase, max 5
        speed = Math.min(5, 1 + frameCount * 0.0003);

        // Ground scroll
        groundOffset = (groundOffset + speed) % 80;

        // Player physics
        if (!player.grounded) {
            player.vy += GRAVITY;
            player.y += player.vy;
            if (player.y >= GROUND_Y) {
                player.y = GROUND_Y;
                player.vy = 0;
                player.jumping = false;
                player.grounded = true;
            }
        }

        // Player height when ducking
        var pH = player.ducking ? 25 : player.h;

        // Spawn obstacles
        nextObstacleIn--;
        if (nextObstacleIn <= 0) {
            var type = ERROR_TYPES[Math.floor(Math.random() * ERROR_TYPES.length)];
            obstacles.push({
                x: W + 20,
                y: GROUND_Y - type.h,
                w: type.w,
                h: type.h,
                label: type.label,
                color: type.color
            });
            nextObstacleIn = Math.floor(100 + Math.random() * 80 - speed * 5);
            nextObstacleIn = Math.max(60, nextObstacleIn);
        }

        // Spawn collectibles
        nextCollectIn--;
        if (nextCollectIn <= 0) {
            var ct = COLLECT_TYPES[Math.floor(Math.random() * COLLECT_TYPES.length)];
            var cy = GROUND_Y - 50 - Math.random() * 60;
            collectibles.push({
                x: W + 20,
                y: cy,
                label: ct.label,
                points: ct.points,
                size: 20,
                seed: Math.random() * 100
            });
            nextCollectIn = Math.floor(80 + Math.random() * 120);
        }

        // Move obstacles
        for (var i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= speed * 2.5;
            if (obstacles[i].x + obstacles[i].w < 0) {
                obstacles.splice(i, 1);
                score++;
                continue;
            }
            // Collision (AABB)
            var o = obstacles[i];
            var px = player.x, py = player.y - pH, pw = player.w;
            if (px + pw > o.x + 4 && px < o.x + o.w - 4 &&
                py + pH > o.y + 4 && py < o.y + o.h - 4) {
                die();
                return;
            }
        }

        // Move collectibles
        for (var j = collectibles.length - 1; j >= 0; j--) {
            collectibles[j].x -= speed * 2.5;
            if (collectibles[j].x < -30) {
                collectibles.splice(j, 1);
                continue;
            }
            var c = collectibles[j];
            var cpx = player.x + player.w / 2;
            var cpy = player.y - pH / 2;
            var dx = cpx - c.x;
            var dy = cpy - c.y;
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
                score += c.points;
                collectibles.splice(j, 1);
            }
        }

        // Move bg clouds
        for (var b = 0; b < bgElements.length; b++) {
            bgElements[b].x -= bgElements[b].speed * speed;
            if (bgElements[b].x + bgElements[b].w < 0) {
                bgElements[b].x = W + Math.random() * 100;
            }
        }
    }

    function die() {
        gameState = 'dead';
        deathMessage = DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('swiftRunnerHigh', String(highScore));
        }
    }

    // --- Render ---
    function render() {
        // Sky gradient
        var skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        skyGrad.addColorStop(0, '#0d1b2a');
        skyGrad.addColorStop(1, '#1b2838');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, GROUND_Y);

        // Ground
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

        // Ground line
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(W, GROUND_Y);
        ctx.stroke();

        // Ground dashes (scrolling)
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (var g = -groundOffset; g < W; g += 80) {
            ctx.beginPath();
            ctx.moveTo(Math.round(g), GROUND_Y + 15);
            ctx.lineTo(Math.round(g + 30), GROUND_Y + 15);
            ctx.stroke();
        }

        // Background clouds
        for (var b = 0; b < bgElements.length; b++) {
            var cloud = bgElements[b];
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.beginPath();
            ctx.ellipse(cloud.x + cloud.w / 2, cloud.y, cloud.w / 2, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (var s = 0; s < 30; s++) {
            var sx = ((s * 137 + 50) % W);
            var sy = ((s * 71 + 10) % (GROUND_Y - 30));
            ctx.fillRect(sx, sy, 1, 1);
        }

        // Draw obstacles
        for (var i = 0; i < obstacles.length; i++) {
            drawObstacle(obstacles[i]);
        }

        // Draw collectibles
        for (var j = 0; j < collectibles.length; j++) {
            drawCollectible(collectibles[j]);
        }

        // Draw player
        drawPlayer();

        // HUD
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px -apple-system, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 20, 30);

        ctx.textAlign = 'right';
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        var dist = Math.floor(distance / 10);
        ctx.fillText(dist + 'm  |  ' + speed.toFixed(1) + 'x', W - 20, 30);

        // Overlays
        if (gameState === 'start') {
            drawOverlay('🏃 Swift Runner', 'Run through the Xcode Workspace!', 'Space/↑ to jump  •  ↓ to duck  •  Click to jump', 'Press Space or click to start');
        } else if (gameState === 'dead') {
            drawOverlay(deathMessage, 'Score: ' + score + '  •  Distance: ' + dist + 'm', 'Press Space or click to restart', 'High Score: ' + highScore);
        }
    }

    function drawObstacle(o) {
        var ox = Math.round(o.x);
        var oy = Math.round(o.y);
        // Error block
        ctx.fillStyle = o.color;
        ctx.globalAlpha = 0.85;
        roundRect(ctx, ox, oy, o.w, o.h, 4);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        roundRect(ctx, ox, oy, o.w, o.h, 4);
        ctx.stroke();

        // Label (only if wide enough)
        if (o.w > 35) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(o.label, ox + o.w / 2, oy + o.h / 2 + 3);
        }
    }

    function drawCollectible(c) {
        // Gentle floating
        var bob = Math.sin(frameCount * 0.02 + c.seed) * 1.5;
        var cx = Math.round(c.x);
        var cy = Math.round(c.y + bob);
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.label, cx, cy);

        // Glow
        ctx.fillStyle = 'rgba(80,250,123,0.12)';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 14, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPlayer() {
        var pH = player.ducking ? 25 : player.h;
        var px = Math.round(player.x);
        var py = Math.round(player.y - pH);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(px + player.w / 2, GROUND_Y + 2, player.w * 0.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        var bodyGrad = ctx.createLinearGradient(px, py, px + player.w, py + pH);
        bodyGrad.addColorStop(0, '#FF6F59');
        bodyGrad.addColorStop(1, '#F05138');
        ctx.fillStyle = bodyGrad;
        roundRect(ctx, px, py, player.w, pH, 6);
        ctx.fill();

        // Eyes
        var eyeY = py + 10;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(px + 10, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 22, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(px + 11, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 23, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Swift chevron on body
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 10, py + pH - 18);
        ctx.lineTo(px + 16, py + pH - 12);
        ctx.lineTo(px + 22, py + pH - 18);
        ctx.stroke();

        // Running legs animation (slow, smooth)
        if (player.grounded && gameState === 'playing') {
            var legPhase = Math.sin(frameCount * 0.12) * 5;
            ctx.strokeStyle = '#FF6F59';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(px + 10, py + pH);
            ctx.lineTo(Math.round(px + 10 + legPhase), py + pH + 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(px + 20, py + pH);
            ctx.lineTo(Math.round(px + 20 - legPhase), py + pH + 10);
            ctx.stroke();
        }
    }

    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
    }

    function drawOverlay(title, subtitle, hint, extra) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        roundRect(ctx, W / 2 - 220, H / 2 - 100, 440, 200, 16);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, W / 2, H / 2 - 45);

        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(subtitle, W / 2, H / 2 - 10);

        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(hint, W / 2, H / 2 + 20);

        if (extra) {
            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#F05138';
            ctx.fillText(extra, W / 2, H / 2 + 55);
        }
    }

    function gameLoop() {
        update();
        render();
        animFrameId = requestAnimationFrame(gameLoop);
    }

    // Expose
    window.SwiftRunner = {
        init: function () {
            gameState = 'start';
            resetGame();
            canvas.focus();
            if (!animFrameId) gameLoop();
        },
        stop: function () {
            gameState = 'start';
            if (animFrameId) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
        }
    };

    // Initial render
    render();
})();
