(function () {
    'use strict';

    // ============ MULTI-WINDOW SYSTEM ============

    // Window registry: each entry has { modal, closeBtn, dockBtn, titlebar, onOpen, onClose }
    var windows = [];
    var dragState = { isDragging: false, modal: null, initialX: 0, initialY: 0 };
    var topZ = 10; // z-index counter for window stacking

    function bringToFront(w) {
        topZ++;
        w.modal.style.zIndex = topZ;
    }

    function registerWindow(config) {
        var w = {
            modal: document.getElementById(config.modalId),
            closeBtn: document.getElementById(config.closeBtnId),
            dockBtn: document.getElementById(config.dockBtnId),
            titlebar: null,
            onOpen: config.onOpen || null,
            onClose: config.onClose || null
        };
        if (!w.modal) return null;
        w.titlebar = w.modal.querySelector('.app-window-titlebar');

        // Dock click → open
        if (w.dockBtn) {
            w.dockBtn.addEventListener('click', function () {
                openWindow(w, w.dockBtn);
            });
        }

        // Close button (Desktop)
        if (w.closeBtn) {
            w.closeBtn.addEventListener('click', function () {
                closeWindow(w);
            });
        }

        // Close button (Mobile iOS action button)
        var mobileBtn = w.modal.querySelector('.mobile-close-btn, .ios-action-close');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', function () {
                closeWindow(w);
            });
        }

        // Drag via titlebar
        if (w.titlebar) {
            w.titlebar.addEventListener('mousedown', function (e) { pointerDown(e, w); });
            w.titlebar.addEventListener('touchstart', function (e) { pointerDown(e, w); }, { passive: false });
        }

        windows.push(w);

        // Click anywhere on window to bring to front
        w.modal.addEventListener('mousedown', function () {
            bringToFront(w);
        });

        return w;
    }

    function openWindow(w, triggerEl) {
        w.lastFocusedElement = triggerEl || document.activeElement;
        if (triggerEl) triggerEl.classList.add('active');
        w.modal.classList.add('show');
        w.modal.setAttribute('aria-hidden', 'false');
        bringToFront(w);
        if (w.closeBtn) w.closeBtn.focus();
        if (w.onOpen) w.onOpen();
    }

    function closeWindow(w) {
        w.modal.classList.remove('show');
        w.modal.setAttribute('aria-hidden', 'true');
        if (w.dockBtn) w.dockBtn.classList.remove('active');
        if (w.lastFocusedElement) w.lastFocusedElement.focus();
        if (w.onClose) w.onClose();
    }

    // Escape closes topmost open window
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            for (var i = windows.length - 1; i >= 0; i--) {
                if (windows[i].modal.classList.contains('show')) {
                    closeWindow(windows[i]);
                    break;
                }
            }
        }
    });

    // ============ DRAG SYSTEM ============

    function pointerDown(e, w) {
        if (e.target.classList.contains('window-button')) return;
        dragState.isDragging = true;
        dragState.modal = w.modal;
        var rect = w.modal.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragState.initialX = clientX - rect.left;
        dragState.initialY = clientY - rect.top;
        w.modal.style.transform = 'none';
    }

    document.addEventListener('mousemove', function (e) {
        if (!dragState.isDragging) return;
        e.preventDefault();
        var clientX = e.clientX;
        dragState.modal.style.left = (clientX - dragState.initialX) + 'px';
        dragState.modal.style.top = (e.clientY - dragState.initialY) + 'px';
    });

    document.addEventListener('touchmove', function (e) {
        if (!dragState.isDragging) return;
        e.preventDefault();
        var clientX = e.touches[0].clientX;
        dragState.modal.style.left = (clientX - dragState.initialX) + 'px';
        dragState.modal.style.top = (e.touches[0].clientY - dragState.initialY) + 'px';
    }, { passive: false });

    document.addEventListener('mouseup', function () { dragState.isDragging = false; });
    document.addEventListener('touchend', function () { dragState.isDragging = false; });

    // ============ REGISTER WINDOWS ============

    // LanguageFlag
    registerWindow({
        modalId: 'appModal',
        closeBtnId: 'closeModalBtn',
        dockBtnId: 'dockLanguageFlag'
    });

    // iOS mobile button for LanguageFlag
    var iosBtn = document.getElementById('iosLanguageFlag');
    if (iosBtn) {
        iosBtn.addEventListener('click', function () {
            var w = windows[0]; // LanguageFlag is first
            openWindow(w, iosBtn);
        });
    }

    // Bug Squasher
    var bugWindow = registerWindow({
        modalId: 'bugSquasherModal',
        closeBtnId: 'closeBugSquasher',
        dockBtnId: 'dockBugSquasher',
        onOpen: function () {
            if (window.BugSquasher) window.BugSquasher.start();
        },
        onClose: function () {
            if (window.BugSquasher) window.BugSquasher.stop();
        }
    });

    // Flappy Swift
    var flappyWindow = registerWindow({
        modalId: 'flappySwiftModal',
        closeBtnId: 'closeFlappySwift',
        dockBtnId: 'dockFlappySwift',
        onOpen: function () {
            if (window.FlappySwift) window.FlappySwift.init();
        },
        onClose: function () {
            if (window.FlappySwift) window.FlappySwift.stop();
        }
    });

    // Swift Runner
    var runnerWindow = registerWindow({
        modalId: 'swiftRunnerModal',
        closeBtnId: 'closeSwiftRunner',
        dockBtnId: 'dockSwiftRunner',
        onOpen: function () {
            if (window.SwiftRunner) window.SwiftRunner.init();
        },
        onClose: function () {
            if (window.SwiftRunner) window.SwiftRunner.stop();
        }
    });

    // Expose for external use
    window.AppWindows = { registerWindow: registerWindow, openWindow: openWindow, closeWindow: closeWindow };
})();
