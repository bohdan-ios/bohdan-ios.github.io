(function () {
    'use strict';

    var container = document.getElementById('bugSquasherGame');
    var gameActive = false;
    var score = 0;
    var timeLeft = 30;
    var spawnInterval = null;
    var timerInterval = null;
    var bugs = [];

    var ERROR_MESSAGES = [
        'EXC_BAD_ACCESS',
        'Thread 1: Fatal error',
        'Unresolved identifier',
        'Type mismatch',
        'Index out of range',
        'Unexpectedly found nil',
        'Missing return',
        'Cannot convert',
        'Ambiguous reference',
        'Segmentation fault',
        'Use of unresolved',
        'Build input file not found',
        'No such module',
        'cannot assign to let',
        'Missing argument'
    ];

    var FEATURE_MESSAGES = [
        'It\'s a Feature™',
        'Works as intended',
        'By design',
        'Won\'t fix'
    ];

    function createUI() {
        container.innerHTML = '';
        container.className = 'game-container bug-squasher-container';

        // HUD
        var hud = document.createElement('div');
        hud.className = 'bs-hud';
        hud.innerHTML =
            '<div class="bs-score">Score: <span id="bsScore">0</span></div>' +
            '<div class="bs-timer">⏱ <span id="bsTimer">30</span>s</div>';
        container.appendChild(hud);

        // Game area
        var area = document.createElement('div');
        area.className = 'bs-game-area';
        area.id = 'bsGameArea';
        container.appendChild(area);

        // Start overlay
        var overlay = document.createElement('div');
        overlay.className = 'bs-overlay';
        overlay.id = 'bsOverlay';
        overlay.innerHTML =
            '<div class="bs-overlay-content">' +
            '<div class="bs-overlay-emoji">🐛</div>' +
            '<h3>Bug Squasher</h3>' +
            '<p>Xcode Debug Console</p>' +
            '<p class="bs-hint">Click bugs to squash them!<br>Avoid the 🦋 features — they\'re not bugs!</p>' +
            '<button class="bs-start-btn" id="bsStartBtn">▶ Build & Run</button>' +
            '</div>';
        container.appendChild(overlay);
    }

    function startGame() {
        score = 0;
        timeLeft = 30;
        bugs = [];
        gameActive = true;

        var overlay = document.getElementById('bsOverlay');
        overlay.style.display = 'none';
        document.getElementById('bsScore').textContent = '0';
        document.getElementById('bsTimer').textContent = '30';
        document.getElementById('bsGameArea').innerHTML = '';

        // Spawn bugs
        spawnInterval = setInterval(function () {
            if (gameActive) spawnBug();
        }, 900);

        // Spawn first bug immediately
        spawnBug();

        // Timer
        timerInterval = setInterval(function () {
            timeLeft--;
            var el = document.getElementById('bsTimer');
            if (el) el.textContent = timeLeft;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function spawnBug() {
        var area = document.getElementById('bsGameArea');
        if (!area) return;

        var isFeature = Math.random() < 0.15; // 15% chance of butterfly
        var bug = document.createElement('div');
        bug.className = isFeature ? 'bs-bug bs-feature' : 'bs-bug';

        var label = isFeature
            ? FEATURE_MESSAGES[Math.floor(Math.random() * FEATURE_MESSAGES.length)]
            : ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

        bug.innerHTML =
            '<span class="bs-bug-emoji">' + (isFeature ? '🦋' : '🐛') + '</span>' +
            '<span class="bs-bug-label">' + label + '</span>';

        // Random position within game area
        var maxX = 350;
        var maxY = 320;
        var x = Math.random() * maxX;
        var y = Math.random() * maxY;
        bug.style.left = x + 'px';
        bug.style.top = y + 'px';

        // Random movement direction
        var angle = Math.random() * Math.PI * 2;
        bug.style.setProperty('--move-x', Math.cos(angle) * 60 + 'px');
        bug.style.setProperty('--move-y', Math.sin(angle) * 60 + 'px');

        bug.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!gameActive) return;
            squashBug(bug, isFeature);
        });

        area.appendChild(bug);
        bugs.push(bug);

        // Remove after 3.5s if not clicked
        setTimeout(function () {
            if (bug.parentNode) {
                bug.classList.add('bs-fade-out');
                setTimeout(function () {
                    if (bug.parentNode) bug.parentNode.removeChild(bug);
                }, 300);
            }
        }, 3500);
    }

    function squashBug(bugEl, isFeature) {
        if (bugEl.classList.contains('bs-squashed')) return;
        bugEl.classList.add('bs-squashed');

        if (isFeature) {
            score -= 3;
            showFloatingText(bugEl, '-3 ❌ That\'s a feature!', '#ff4444');
        } else {
            score += 1;
            showFloatingText(bugEl, '+1 ✅', '#44ff44');
        }

        document.getElementById('bsScore').textContent = score;

        setTimeout(function () {
            if (bugEl.parentNode) bugEl.parentNode.removeChild(bugEl);
        }, 400);
    }

    function showFloatingText(refEl, text, color) {
        var area = document.getElementById('bsGameArea');
        var float = document.createElement('div');
        float.className = 'bs-float-text';
        float.textContent = text;
        float.style.color = color;
        float.style.left = refEl.style.left;
        float.style.top = refEl.style.top;
        area.appendChild(float);

        setTimeout(function () {
            if (float.parentNode) float.parentNode.removeChild(float);
        }, 1000);
    }

    function endGame() {
        gameActive = false;
        clearInterval(spawnInterval);
        clearInterval(timerInterval);

        var overlay = document.getElementById('bsOverlay');
        var success = score >= 10;
        overlay.innerHTML =
            '<div class="bs-overlay-content">' +
            '<div class="bs-overlay-emoji">' + (success ? '✅' : '❌') + '</div>' +
            '<h3>' + (success ? 'Build Succeeded' : 'Build Failed') + '</h3>' +
            '<p class="bs-final-score">Score: ' + score + '</p>' +
            '<p class="bs-hint">' + (success
                ? '"Shipped with zero known bugs!" (for now...)'
                : '"Too many bugs shipped to production 💀"') + '</p>' +
            '<button class="bs-start-btn" id="bsStartBtn">⟳ Rebuild</button>' +
            '</div>';
        overlay.style.display = 'flex';

        document.getElementById('bsStartBtn').addEventListener('click', startGame);
    }

    function stopGame() {
        gameActive = false;
        clearInterval(spawnInterval);
        clearInterval(timerInterval);
    }

    // Initialize
    createUI();
    document.getElementById('bsStartBtn').addEventListener('click', startGame);

    // Expose for window system
    window.BugSquasher = {
        start: function () {
            createUI();
            document.getElementById('bsStartBtn').addEventListener('click', startGame);
        },
        stop: stopGame
    };

    // Expose render_game_to_text for testing
    window.render_game_to_text_bug_squasher = function () {
        return JSON.stringify({
            mode: gameActive ? 'playing' : 'idle',
            score: score,
            timeLeft: timeLeft,
            bugsOnScreen: document.querySelectorAll('.bs-bug:not(.bs-squashed)').length
        });
    };
})();
