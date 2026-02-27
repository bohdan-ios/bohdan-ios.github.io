(function () {
    'use strict';

    var canvas = document.getElementById('particleBirdCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var W, H;
    var mouse = { x: -9999, y: -9999 };
    var particles = [];
    var PARTICLE_COUNT = 2500;
    var MOUSE_RADIUS = 90;
    var RETURN_SPEED = 0.04;
    var SCATTER_FORCE = 8;
    var imageLoaded = false;
    var birdImageData = null;
    var birdImgW = 0, birdImgH = 0;

    // Load the bird painting to sample colors from
    var birdImg = new Image();
    birdImg.crossOrigin = "Anonymous"; // Handle CORS if served properly
    birdImg.onload = function () {
        // Draw to offscreen canvas to read pixels
        var offCanvas = document.createElement('canvas');
        offCanvas.width = birdImg.width;
        offCanvas.height = birdImg.height;
        var offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(birdImg, 0, 0);
        birdImageData = offCtx.getImageData(0, 0, birdImg.width, birdImg.height);
        birdImgW = birdImg.width;
        birdImgH = birdImg.height;
        imageLoaded = true;
        resize(); // reinit with image data
    };
    birdImg.src = 'assets/bird-painting.png';

    function getTargetPointsFromImage(cx, cy, scale) {
        if (!imageLoaded || !birdImageData) return [];

        var points = [];
        var data = birdImageData.data;
        var iw = birdImgW, ih = birdImgH;

        // Scale the image to fit desired size
        var fitW = scale * 2;
        var fitH = scale * 2;
        var stepX = Math.max(2, Math.floor(iw / (fitW / 2)));
        var stepY = Math.max(2, Math.floor(ih / (fitH / 2)));

        for (var y = 0; y < ih; y += stepY) {
            for (var x = 0; x < iw; x += stepX) {
                var i = (y * iw + x) * 4;
                var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

                // Skip near-black background pixels
                var brightness = (r + g + b) / 3;
                if (brightness < 30 || a < 128) continue;

                // Map image coords to canvas coords
                var px = cx + (x / iw - 0.5) * fitW;
                var py = cy + (y / ih - 0.5) * fitH;

                points.push({
                    x: px,
                    y: py,
                    r: r,
                    g: g,
                    b: b,
                    brightness: brightness
                });
            }
        }

        return points;
    }

    function resize() {
        var rect = canvas.parentElement.getBoundingClientRect();
        W = canvas.width = rect.width;
        H = canvas.height = rect.height;
        initParticles();
    }

    function initParticles() {
        particles = [];
        var scale = Math.min(W, H) * 0.45;
        var targetPoints = getTargetPointsFromImage(W / 2, H / 2, scale);

        if (targetPoints.length === 0) return;

        for (var i = 0; i < PARTICLE_COUNT; i++) {
            var tp = targetPoints[Math.floor(Math.random() * targetPoints.length)];
            // Slight jitter for organic brushstroke feel
            var jx = tp.x + (Math.random() - 0.5) * 3;
            var jy = tp.y + (Math.random() - 0.5) * 3;

            // Vary size based on brightness — darker areas get smaller dense particles,
            // lighter areas get larger soft particles (like watercolor washes)
            var brightNorm = tp.brightness / 255;
            var size = 0.8 + brightNorm * 2.5 + Math.random() * 0.8;

            // Sample color directly from the painting with slight variation
            var cr = Math.min(255, tp.r + (Math.random() - 0.5) * 20);
            var cg = Math.min(255, tp.g + (Math.random() - 0.5) * 15);
            var cb = Math.min(255, tp.b + (Math.random() - 0.5) * 10);

            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                tx: jx,
                ty: jy,
                vx: 0,
                vy: 0,
                size: size,
                alpha: 0.5 + brightNorm * 0.45 + Math.random() * 0.05,
                cr: cr,
                cg: cg,
                cb: cb,
                brightness: brightNorm
            });
        }
    }

    function update() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Mouse repulsion
            var dx = p.x - mouse.x;
            var dy = p.y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MOUSE_RADIUS && dist > 0) {
                var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                var angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force * SCATTER_FORCE;
                p.vy += Math.sin(angle) * force * SCATTER_FORCE;
            }

            // Spring back
            p.vx += (p.tx - p.x) * RETURN_SPEED;
            p.vy += (p.ty - p.y) * RETURN_SPEED;

            // Damping
            p.vx *= 0.88;
            p.vy *= 0.88;

            p.x += p.vx;
            p.y += p.vy;
        }
    }

    function render() {
        ctx.clearRect(0, 0, W, H);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

            // Use the sampled painting color directly
            var alpha = Math.min(1, p.alpha + speed * 0.01);

            // Slightly brighten when moving (like light catching feathers)
            var boost = Math.min(30, speed * 3);
            var r = Math.min(255, p.cr + boost);
            var g = Math.min(255, p.cg + boost * 0.6);
            var b = Math.min(255, p.cb + boost * 0.3);

            ctx.fillStyle = 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + alpha + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Glow for scattered particles
            if (speed > 3) {
                var ga = Math.min(0.25, speed * 0.02);
                ctx.fillStyle = 'rgba(' + Math.round(Math.min(255, r + 30)) + ',' + Math.round(Math.min(255, g + 20)) + ',' + Math.round(Math.min(255, b + 10)) + ',' + ga + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function loop() {
        update();
        render();
        requestAnimationFrame(loop);
    }

    // Mouse tracking
    var desktop = document.querySelector('.macos-desktop');
    if (desktop) {
        desktop.addEventListener('mousemove', function (e) {
            var rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        desktop.addEventListener('mouseleave', function () {
            mouse.x = -9999;
            mouse.y = -9999;
        });
    }

    window.addEventListener('resize', resize);
    resize();
    loop();

    // --- Draw realistic birds on widget canvases ---
    function drawRealisticBird(cvs, isBaby, colorVariant) {
        var c = cvs.getContext('2d');
        var w = cvs.width, h = cvs.height;
        c.clearRect(0, 0, w, h);

        var scale = isBaby ? 0.8 : 1.0;
        var cx = w * 0.5, cy = h * 0.55;

        var bodyColors = [
            ['#6B4226', '#8B5E3C'],
            ['#4a6741', '#6b8f5e'],
            ['#5c5c78', '#7878a0'],
            ['#8B4513', '#A0522D']
        ];
        var bc = bodyColors[colorVariant % bodyColors.length];

        c.save();
        c.translate(cx, cy);
        c.scale(scale, scale);

        // Tail feathers
        c.fillStyle = bc[0];
        c.beginPath();
        c.moveTo(-12, 2);
        c.quadraticCurveTo(-18, -4, -16, 2);
        c.quadraticCurveTo(-18, 6, -12, 5);
        c.closePath();
        c.fill();

        // Body
        c.fillStyle = bc[1];
        c.beginPath();
        c.ellipse(0, 2, 10, 7, -0.15, 0, Math.PI * 2);
        c.fill();

        // Wing
        c.fillStyle = bc[0];
        c.beginPath();
        c.ellipse(2, 0, 7, 5, -0.3, 0, Math.PI * 2);
        c.fill();

        // Wing detail
        c.strokeStyle = 'rgba(255,255,255,0.15)';
        c.lineWidth = 0.5;
        c.beginPath();
        c.moveTo(-3, -1);
        c.quadraticCurveTo(2, -3, 7, -1);
        c.stroke();

        // Head
        c.fillStyle = bc[1];
        c.beginPath();
        c.arc(9, -5, 5.5, 0, Math.PI * 2);
        c.fill();

        // Breast
        c.fillStyle = '#e8d5b8';
        c.beginPath();
        c.ellipse(3, 6, 6, 3.5, 0.1, 0, Math.PI * 2);
        c.fill();

        // Eye
        c.fillStyle = 'white';
        c.beginPath();
        c.arc(11, -6, 2.2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#1a1a1a';
        c.beginPath();
        c.arc(11.5, -6, 1.2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.beginPath();
        c.arc(12, -6.5, 0.5, 0, Math.PI * 2);
        c.fill();

        // Beak
        c.fillStyle = '#E8A317';
        c.beginPath();
        c.moveTo(14, -5);
        c.lineTo(17, -4.5);
        c.lineTo(14, -3.5);
        c.closePath();
        c.fill();

        // Legs
        c.strokeStyle = '#8B7355';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(2, 8); c.lineTo(1, 12);
        c.moveTo(1, 12); c.lineTo(-1, 13);
        c.moveTo(1, 12); c.lineTo(3, 13);
        c.stroke();
        c.beginPath();
        c.moveTo(6, 8); c.lineTo(7, 12);
        c.moveTo(7, 12); c.lineTo(5, 13);
        c.moveTo(7, 12); c.lineTo(9, 13);
        c.stroke();

        c.restore();
    }

    var birdCanvases = document.querySelectorAll('.widget-bird');
    birdCanvases.forEach(function (cvs, i) {
        drawRealisticBird(cvs, cvs.classList.contains('bird-4'), i);
    });

    // Bird fly-away on hover
    var birds = document.querySelectorAll('.widget-bird');
    birds.forEach(function (bird) {
        bird.addEventListener('mouseenter', function () {
            if (bird.classList.contains('bird-flying')) return;
            bird.classList.add('bird-flying');
            setTimeout(function () {
                bird.style.opacity = '0';
                setTimeout(function () {
                    bird.classList.remove('bird-flying');
                    bird.style.opacity = '';
                }, 3000);
            }, 800);
        });
    });
})();
