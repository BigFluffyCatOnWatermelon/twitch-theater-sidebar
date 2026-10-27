// ==UserScript==
// @name         Twitch Theater Sidebar on Hover
// @namespace    https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @homepageURL  https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @supportURL   https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/issues
// @version      2.0.4
// @description  Slide Twitch's original For You/sidebar out from the left edge in theater mode.
// @match        https://www.twitch.tv/*
// @updateURL    https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js
// @downloadURL  https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    const CONFIG = Object.freeze({
        edgeWidth: 24,
        sidebarWidth: 260,
        showDelay: 75,
        hideDelay: 260,
        animationMs: 220,
        pollMs: 800,
        mutationDebounceMs: 180
    });

    const ROOT_CLASS = 'tts-theater-mode-active';
    const SIDEBAR_CLASS = 'tts-native-sidebar';
    const OPEN_CLASS = 'tts-native-sidebar-open';
    const STYLE_ID = 'twitch-theater-sidebar-style';

    // Remove leftovers from v1, which created a separate cloned overlay.
    document.getElementById('twitch-theater-sidebar-panel')?.remove();
    document.getElementById('twitch-theater-sidebar-trigger')?.remove();
    document.getElementById(STYLE_ID)?.remove();

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
        'html.' + ROOT_CLASS + ' .' + SIDEBAR_CLASS + ' {' +
        ' position: fixed !important;' +
        ' inset-block-start: var(--tts-native-sidebar-top, 0px) !important;' +
        ' inset-inline-start: 0 !important;' +
        ' inset-block-end: 0 !important;' +
        ' width: min(' + CONFIG.sidebarWidth + 'px, 88vw) !important;' +
        ' min-width: min(' + CONFIG.sidebarWidth + 'px, 88vw) !important;' +
        ' max-width: 88vw !important;' +
        ' height: auto !important; min-height: 0 !important; max-height: none !important;' +
        ' margin: 0 !important; box-sizing: border-box !important;' +
        ' display: flex !important; flex-direction: column !important; align-items: stretch !important;' +
        ' overflow-x: hidden !important; overflow-y: auto !important;' +
        ' visibility: visible !important; opacity: 1 !important;' +
        ' z-index: 2147483000 !important;' +
        ' background: var(--color-background-base, #0e0e10) !important;' +
        ' border-right: 1px solid rgba(255, 255, 255, 0.10) !important;' +
        ' box-shadow: none !important;' +
        ' transform: translateX(calc(-100% - 10px)) !important;' +
        ' transition: transform ' + CONFIG.animationMs + 'ms cubic-bezier(0.22, 1, 0.36, 1) !important;' +
        ' pointer-events: none !important; will-change: transform;' +
        '}' +
        'html.' + ROOT_CLASS + ' .' + SIDEBAR_CLASS + '.' + OPEN_CLASS + ' {' +
        ' transform: translateX(0) !important; pointer-events: auto !important;' +
        ' box-shadow: 5px 0 24px rgba(0, 0, 0, 0.38) !important;' +
        '}' +
        '@media (prefers-reduced-motion: reduce) {' +
        ' html.' + ROOT_CLASS + ' .' + SIDEBAR_CLASS + ' { transition: none !important; }' +
        '}';
    (document.head || document.documentElement).appendChild(style);

    const root = document.documentElement;

    const SIDEBAR_SELECTORS = [
        '.side-nav',
        '#side-nav',
        '[data-test-selector="side-nav"]',
        '[data-a-target="side-nav-bar"]',
        '[aria-label="Left Navigation"]',
        '.side-bar-contents nav'
    ];

    const THEATER_SELECTORS = [
        '.channel-root__scroll-area--theatre-mode',
        '.channel-root--theatre',
        '.channel-root--theater',
        '[class*="channel-root"][class*="theatre"]',
        '[class*="channel-root"][class*="theater"]',
        'button[aria-label*="Exit Theatre Mode" i]',
        'button[aria-label*="Exit Theater Mode" i]',
        '[data-a-target="player-theatre-mode-button"][aria-pressed="true"]'
    ];

    let theaterActive = false;
    let sidebar = null;
    let isOpen = false;
    let expandedByScript = false;
    let showTimer = null;
    let hideTimer = null;
    let collapseTimer = null;
    let mutationTimer = null;
    let lastPointerX = Number.POSITIVE_INFINITY;
    let savedTopProperty = null;

    function findSidebar() {
        for (const selector of SIDEBAR_SELECTORS) {
            const found = document.querySelector(selector);
            if (found && found.isConnected) return found;
        }
        return null;
    }

    function isTheaterMode() {
        return THEATER_SELECTORS.some(selector => document.querySelector(selector) !== null);
    }

    function getToggleButton(nav) {
        if (!nav) return null;
        return nav.querySelector(
            '[data-a-target="side-nav-arrow"],' +
            'button[aria-label*="Expand sidebar" i],' +
            'button[aria-label*="Collapse sidebar" i],' +
            'button[aria-label*="Expand Side Navigation" i],' +
            'button[aria-label*="Collapse Side Navigation" i]'
        );
    }

    function isCollapsed(nav) {
        if (!nav) return false;
        if (nav.classList.contains('side-nav--collapsed')) return true;
        if (nav.classList.contains('side-nav--expanded')) return false;

        const toggle = getToggleButton(nav);
        if (toggle && toggle.getAttribute('aria-expanded') === 'false') return true;
        if (toggle && toggle.getAttribute('aria-expanded') === 'true') return false;
        return false;
    }

    function getNativeTop(nav) {
        const rect = nav.getBoundingClientRect();
        if (Number.isFinite(rect.top) && rect.top > 1 && rect.top < window.innerHeight / 2) {
            return Math.round(rect.top);
        }

        // If the hidden sidebar reports top: 0, align it under Twitch's existing top bar.
        const topBar = document.querySelector(
            '[data-a-target="top-nav-container"], .top-nav, .top-bar'
        );
        if (topBar) {
            const topBarRect = topBar.getBoundingClientRect();
            if (topBarRect.height > 0 && topBarRect.bottom > 0 && topBarRect.bottom < 180) {
                return Math.round(topBarRect.bottom);
            }
        }

        return 0;
    }

    function rememberTopProperty(nav) {
        savedTopProperty = {
            value: nav.style.getPropertyValue('--tts-native-sidebar-top'),
            priority: nav.style.getPropertyPriority('--tts-native-sidebar-top')
        };
        nav.style.setProperty('--tts-native-sidebar-top', getNativeTop(nav) + 'px');
    }

    function restoreTopProperty(nav) {
        if (!nav || !savedTopProperty) return;
        if (savedTopProperty.value) {
            nav.style.setProperty(
                '--tts-native-sidebar-top',
                savedTopProperty.value,
                savedTopProperty.priority
            );
        } else {
            nav.style.removeProperty('--tts-native-sidebar-top');
        }
        savedTopProperty = null;
    }

    function clickNativeToggle(nav) {
        const toggle = getToggleButton(nav);
        if (!toggle) return false;
        toggle.click();
        return true;
    }

    function clearTimers() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        clearTimeout(collapseTimer);
        showTimer = null;
        hideTimer = null;
        collapseTimer = null;
    }

    function collapseIfExpandedByScript() {
        collapseTimer = null;
        if (!expandedByScript) return;

        const nav = sidebar;
        if (nav && nav.isConnected && !isCollapsed(nav)) {
            clickNativeToggle(nav);
        }
        expandedByScript = false;
    }

    function closeSidebar() {
        clearTimeout(showTimer);
        showTimer = null;
        clearTimeout(hideTimer);
        hideTimer = null;

        if (sidebar) sidebar.classList.remove(OPEN_CLASS);
        isOpen = false;

        clearTimeout(collapseTimer);
        collapseTimer = null;

        if (expandedByScript) {
            collapseTimer = setTimeout(
                collapseIfExpandedByScript,
                CONFIG.animationMs + 35
            );
        }
    }

    function openSidebar() {
        showTimer = null;
        if (!theaterActive) return;

        clearTimeout(hideTimer);
        hideTimer = null;
        clearTimeout(collapseTimer);
        collapseTimer = null;

        if (!sidebar || !sidebar.isConnected) {
            syncState();
            if (!sidebar) return;
        }

        // Expand Twitch's own navigation so its real labels/metadata are rendered.
        if (isCollapsed(sidebar)) {
            if (clickNativeToggle(sidebar)) expandedByScript = true;
        }

        sidebar.classList.add(OPEN_CLASS);
        isOpen = true;
    }

    function scheduleShow() {
        if (!theaterActive) return;
        clearTimeout(hideTimer);
        hideTimer = null;
        if (isOpen) return;
        clearTimeout(collapseTimer);
        collapseTimer = null;
        clearTimeout(showTimer);
        showTimer = setTimeout(openSidebar, CONFIG.showDelay);
    }

    function scheduleHide() {
        if (!isOpen) return;
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            hideTimer = null;
            if (sidebar && sidebar.matches(':hover')) return;
            closeSidebar();
        }, CONFIG.hideDelay);
    }

    function restoreSidebar(nav, shouldRestoreExpandedState) {
        if (!nav) return;

        nav.classList.remove(OPEN_CLASS);

        if (
            shouldRestoreExpandedState &&
            expandedByScript &&
            nav.isConnected &&
            !isCollapsed(nav)
        ) {
            clickNativeToggle(nav);
        }

        nav.classList.remove(SIDEBAR_CLASS);
        restoreTopProperty(nav);
    }

    function deactivateTheaterMode() {
        if (!theaterActive && !sidebar) return;

        clearTimers();
        if (sidebar) restoreSidebar(sidebar, true);
        root.classList.remove(ROOT_CLASS);

        theaterActive = false;
        sidebar = null;
        isOpen = false;
        expandedByScript = false;
        savedTopProperty = null;
    }

    function activateTheaterMode(nextSidebar) {
        const wasOpen = isOpen;
        const shouldReopen = wasOpen || lastPointerX <= CONFIG.edgeWidth;

        if (sidebar) restoreSidebar(sidebar, sidebar.isConnected);

        sidebar = nextSidebar;
        isOpen = false;
        expandedByScript = false;
        savedTopProperty = null;

        if (!sidebar) return;

        rememberTopProperty(sidebar);
        sidebar.classList.add(SIDEBAR_CLASS);

        if (shouldReopen) scheduleShow();
    }

    function syncState() {
        const shouldBeTheater = isTheaterMode();

        if (!shouldBeTheater) {
            deactivateTheaterMode();
            return;
        }

        const foundSidebar = findSidebar();

        if (!theaterActive) {
            theaterActive = true;
            root.classList.add(ROOT_CLASS);
        }

        if (foundSidebar !== sidebar) {
            activateTheaterMode(foundSidebar);
        } else if (sidebar) {
            // React can overwrite classes on the existing element during rerenders.
            sidebar.classList.add(SIDEBAR_CLASS);
            if (isOpen) sidebar.classList.add(OPEN_CLASS);
        }
    }

    document.addEventListener('mousemove', event => {
        lastPointerX = event.clientX;
        if (!theaterActive) return;

        if (event.clientX <= CONFIG.edgeWidth) {
            scheduleShow();
        } else if (
            isOpen &&
            sidebar &&
            !sidebar.contains(event.target) &&
            hideTimer === null
        ) {
            // Start the hide delay once when leaving, rather than resetting it
            // on every mousemove while the cursor crosses the player.
            scheduleHide();
        }
    }, { passive: true });

    document.addEventListener('pointerdown', event => {
        if (isOpen && sidebar && !sidebar.contains(event.target)) {
            closeSidebar();
        }
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isOpen) closeSidebar();
    });

    // Keep the actual Twitch navigation open while the pointer is over it.
    document.addEventListener('mouseover', event => {
        if (!isOpen || !sidebar || !sidebar.contains(event.target)) return;
        clearTimeout(hideTimer);
        hideTimer = null;
        clearTimeout(collapseTimer);
        collapseTimer = null;
    }, true);

    document.addEventListener('mouseout', event => {
        if (!isOpen || !sidebar) return;
        if (sidebar.contains(event.target) && !sidebar.contains(event.relatedTarget)) {
            scheduleHide();
        }
    }, true);

    function scheduleSync() {
        if (mutationTimer !== null) return;
        mutationTimer = setTimeout(() => {
            mutationTimer = null;
            syncState();
        }, CONFIG.mutationDebounceMs);
    }

    // Twitch is a single-page app; handle theater toggles and native nav replacement.
    const observer = new MutationObserver(mutations => {
        // Restore our classes immediately if Twitch rewrites the native nav className.
        if (mutations.some(mutation =>
            mutation.type === 'attributes' &&
            (mutation.target === sidebar || mutation.target === root)
        )) {
            syncState();
            return;
        }
        scheduleSync();
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-label', 'aria-pressed']
    });

    window.setInterval(syncState, CONFIG.pollMs);
    syncState();
})();
