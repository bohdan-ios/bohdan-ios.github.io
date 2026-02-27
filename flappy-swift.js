(function () {
    'use strict';

    var canvas = document.getElementById('flappyCanvas');
    var ctx = canvas.getContext('2d');
    var W = 550, H = 600;
    var animFrameId = null;
    var gameState = 'start'; // start, playing, dead
    var score = 0;
    var highScore = parseInt(localStorage.getItem('flappySwiftHigh') || '0', 10);
    var deathMessage = '';

    // Bird
    var bird = { x: 80, y: 250, vy: 0, r: 16 };
    var GRAVITY = 0.2;
    var FLAP_VEL = -6;

    // Pipes
    var pipes = [];
    var PIPE_WIDTH = 55;
    var GAP = 200;
    var PIPE_SPEED = 1.5;
    var PIPE_INTERVAL = 130; // frames
    var frameCount = 0;

    var ERROR_LABELS = [
        'Signing Error',
        'Missing Profile',
        'CocoaPods conflict',
        'Linker error',
        'Build Failed',
        'Archive Error',
        'Simulator crash',
        'Storyboard bug',
        'Missing entitlement',
        'Code Sign error',
        'No provisioning',
        'Swift version mismatch',
        'Dependency cycle',
        'Merge conflict',
        'dSYM not found'
    ];

    function resetGame() {
        bird.x = 80;
        bird.y = 250;
        bird.vy = 0;
        pipes = [];
        score = 0;
        frameCount = 0;
    }

    function flap() {
        if (gameState === 'start') {
            gameState = 'playing';
            resetGame();
        } else if (gameState === 'dead') {
            gameState = 'playing';
            resetGame();
        }
        if (gameState === 'playing') {
            bird.vy = FLAP_VEL;
        }
    }

    // Input
    canvas.addEventListener('click', function (e) {
        e.stopPropagation();
        flap();
    });
    canvas.addEventListener('keydown', function (e) {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            flap();
        }
    });
    canvas.setAttribute('tabindex', '0');

    function spawnPipe() {
        var minTop = 60;
        var maxTop = H - GAP - 60;
        var topH = minTop + Math.random() * (maxTop - minTop);
        var label = ERROR_LABELS[Math.floor(Math.random() * ERROR_LABELS.length)];
        pipes.push({
            x: W,
            topH: topH,
            bottomY: topH + GAP,
            scored: false,
            label: label
        });
    }

    function update() {
        if (gameState !== 'playing') return;

        frameCount++;

        // Bird physics
        bird.vy += GRAVITY;
        bird.y += bird.vy;

        // Spawn pipes
        if (frameCount % PIPE_INTERVAL === 0) {
            spawnPipe();
        }

        // Move pipes
        for (var i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= PIPE_SPEED;

            // Score
            if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
                pipes[i].scored = true;
                score++;
            }

            // Remove offscreen
            if (pipes[i].x + PIPE_WIDTH < -10) {
                pipes.splice(i, 1);
            }
        }

        // Collision detection
        if (bird.y - bird.r < 0 || bird.y + bird.r > H) {
            die();
            return;
        }

        for (var j = 0; j < pipes.length; j++) {
            var p = pipes[j];
            if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_WIDTH) {
                if (bird.y - bird.r < p.topH || bird.y + bird.r > p.bottomY) {
                    die();
                    return;
                }
            }
        }
    }

    function die() {
        gameState = 'dead';
        var deathMsgs = [
            '💥 App Crashed!',
            '💀 EXC_BAD_ACCESS',
            '🔥 Fatal Error!',
            '⚠️ Thread 1: Signal SIGABRT'
        ];
        deathMessage = deathMsgs[Math.floor(Math.random() * deathMsgs.length)];
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappySwiftHigh', String(highScore));
        }
    }

    function render() {
        // Sky gradient
        var grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0d1b2a');
        grad.addColorStop(1, '#1b2838');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Grid lines (code editor feel)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (var gy = 0; gy < H; gy += 20) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(W, gy);
            ctx.stroke();
        }

        // Pipes
        for (var i = 0; i < pipes.length; i++) {
            var p = pipes[i];

            // Top pipe
            var topGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
            topGrad.addColorStop(0, '#ff3b30');
            topGrad.addColorStop(1, '#cc2d25');
            ctx.fillStyle = topGrad;
            ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH);

            // Bottom pipe
            ctx.fillStyle = topGrad;
            ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, H - p.bottomY);

            // Pipe borders
            ctx.strokeStyle = '#ff6b5e';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topH);
            ctx.strokeRect(p.x, p.bottomY, PIPE_WIDTH, H - p.bottomY);

            // Error label on pipe
            ctx.save();
            ctx.translate(p.x + PIPE_WIDTH / 2, p.topH - 10);
            ctx.fillStyle = '#ffccc8';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.label, 0, 0);
            ctx.restore();
        }

        // Bird (Swift logo style — orange circle with bird)
        ctx.save();
        ctx.translate(bird.x, bird.y);

        // Rotation based on velocity
        var angle = Math.min(Math.max(bird.vy * 0.06, -0.5), 0.7);
        ctx.rotate(angle);

        // Body
        ctx.fillStyle = '#F05138';
        ctx.beginPath();
        ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#FF6F59';
        ctx.beginPath();
        ctx.arc(-3, -3, bird.r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(6, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(7, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#FFB800';
        ctx.beginPath();
        ctx.moveTo(bird.r - 2, -2);
        ctx.lineTo(bird.r + 8, 1);
        ctx.lineTo(bird.r - 2, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Score
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px -apple-system, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(score, W / 2, 40);

        // Overlays
        if (gameState === 'start') {
            drawOverlay('🐦 Flappy Swift', 'Navigate through Xcode errors!', 'Click or Space to flap', 'High Score: ' + highScore);
        } else if (gameState === 'dead') {
            var msg = deathMessage;
            drawOverlay(msg, 'Score: ' + score, 'Tap to restart', 'High Score: ' + highScore);
        }
    }

    function drawOverlay(title, subtitle, hint, extra) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        roundRect(ctx, W / 2 - 150, H / 2 - 100, 300, 200, 16);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 22px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, W / 2, H / 2 - 50);

        ctx.font = '16px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(subtitle, W / 2, H / 2 - 15);

        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(hint, W / 2, H / 2 + 25);

        if (extra) {
            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#F05138';
            ctx.fillText(extra, W / 2, H / 2 + 60);
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

    function gameLoop() {
        update();
        render();
        animFrameId = requestAnimationFrame(gameLoop);
    }

    // Expose for window system
    window.FlappySwift = {
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

    // Expose render_game_to_text for testing
    window.render_game_to_text_flappy = function () {
        return JSON.stringify({
            mode: gameState,
            score: score,
            highScore: highScore,
            bird: { x: bird.x, y: bird.y, vy: bird.vy },
            pipes: pipes.map(function (p) { return { x: p.x, topH: p.topH, gap: GAP }; })
        });
    };

    // Initial render
    render();
})();
