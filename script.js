(function () {
    'use strict';

    // --- DOM references ---
    var modal = document.getElementById('appModal');
    var closeBtn = document.getElementById('closeModalBtn');
    var dockBtn = document.getElementById('dockLanguageFlag');
    var iosBtn = document.getElementById('iosLanguageFlag');
    var titlebar = document.querySelector('.app-window-titlebar');
    var lastFocusedElement = null;

    // --- Modal open / close ---
    function openAppModal(triggerEl) {
        lastFocusedElement = triggerEl || document.activeElement;
        if (triggerEl) triggerEl.classList.add('active');
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
    }

    function closeAppModal() {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        dockBtn.classList.remove('active');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    dockBtn.addEventListener('click', function () { openAppModal(dockBtn); });
    iosBtn.addEventListener('click', function () { openAppModal(iosBtn); });
    closeBtn.addEventListener('click', closeAppModal);

    // Escape key closes modal
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeAppModal();
        }
    });

    // --- Focus trap inside modal ---
    modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var focusable = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // --- Draggable window (mouse + touch) ---
    var isDragging = false;
    var initialX, initialY;

    function pointerDown(e) {
        if (e.target.classList.contains('window-button')) return;
        isDragging = true;
        var rect = modal.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        initialX = clientX - rect.left;
        initialY = clientY - rect.top;
        modal.style.transform = 'none';
    }

    function pointerMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        modal.style.left = (clientX - initialX) + 'px';
        modal.style.top = (clientY - initialY) + 'px';
    }

    function pointerUp() {
        isDragging = false;
    }

    titlebar.addEventListener('mousedown', pointerDown);
    document.addEventListener('mousemove', pointerMove);
    document.addEventListener('mouseup', pointerUp);

    titlebar.addEventListener('touchstart', pointerDown, { passive: false });
    document.addEventListener('touchmove', pointerMove, { passive: false });
    document.addEventListener('touchend', pointerUp);
})();
