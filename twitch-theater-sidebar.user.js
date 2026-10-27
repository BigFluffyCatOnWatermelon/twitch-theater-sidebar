// ==UserScript==
// @name         Twitch Theater Sidebar on Hover
// @namespace    https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @homepageURL  https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @supportURL   https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/issues
// @version      3.0.0
// @description  Reveal Twitch's original "For You" sidebar at the left edge in theater mode.
// @match        https://www.twitch.tv/*
// @noframes
// @updateURL    https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js
// @downloadURL  https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    const CFG = {
        edge: 30,
        width: 270,
        showDelay: 70,
        hideDelay: 260,
        animation: 220,
        poll: 1200
    };

    const ROOT_CLASS = 'tts30-layout';
    const NAV_CLASS = 'tts30-native-nav';
    const OPEN_CLASS = 'tts30-open';
    const STYLE_ID = 'tts30-style';

    // Clean up obsolete UI made by older versions. The native Twitch navigation is untouched here.
    document.getElementById('twitch-theater-sidebar-panel')?.remove();
    document.getElementById('twitch-theater-sidebar-trigger')?.remove();
    document.getElementById('tms-overlay')?.remove();
    document.getElementById('tms-trigger')?.remove();
    document.getElementById(STYLE_ID)?.remove();

    const css = document.createElement('style');
    css.id = STYLE_ID;
    css.textContent =
        'html.' + ROOT_CLASS + ' .' + NAV_CLASS + ' {' +
        ' position:fixed!important;' +
        ' top:var(--tts30-top,0px)!important;' +
        ' left:0!important; right:auto!important; bottom:0!important;' +
        ' width:min(' + CFG.width + 'px,88vw)!important;' +
        ' min-width:min(' + CFG.width + 'px,88vw)!important;' +
        ' max-width:88vw!important; height:auto!important;' +
        ' min-height:0!important; max-height:none!important; margin:0!important;' +
        ' box-sizing:border-box!important; display:flex!important;' +
        ' flex-direction:column!important; align-items:stretch!important;' +
        ' overflow-x:hidden!important; overflow-y:auto!important;' +
        ' visibility:visible!important; opacity:1!important;' +
        ' z-index:2147483000!important;' +
        ' background:var(--color-background-base,#0e0e10)!important;' +
        ' border-right:1px solid rgba(255,255,255,.12)!important;' +
        ' transform:translate3d(calc(-100% - 12px),0,0)!important;' +
        ' transition:transform ' + CFG.animation + 'ms cubic-bezier(.22,1,.36,1)!important;' +
        ' pointer-events:none!important; will-change:transform;' +
        '}' +
        'html.' + ROOT_CLASS + ' .' + NAV_CLASS + '.' + OPEN_CLASS + ' {' +
        ' transform:translate3d(0,0,0)!important; pointer-events:auto!important;' +
        ' box-shadow:5px 0 24px rgba(0,0,0,.4)!important;' +
        '}' +
        'html.' + ROOT_CLASS + ' .' + NAV_CLASS + ' .side-nav-section,' +
        'html.' + ROOT_CLASS + ' .' + NAV_CLASS + ' [data-a-target="side-nav-section"] {' +
        ' width:100%!important; max-width:100%!important;' +
        '}' +
        'html.' + ROOT_CLASS + ' .' + NAV_CLASS + ' .side-nav-card__title,' +
        'html.' + ROOT_CLASS + ' .' + NAV_CLASS + ' .side-nav-card__metadata,' +
        'html.' + ROOT_CLASS + ' .' + NAV_CLASS + ' [data-a-target="side-nav-card-metadata"] {' +
        ' min-width:0;' +
        '}' +
        '@media(prefers-reduced-motion:reduce){html.' + ROOT_CLASS + ' .' + NAV_CLASS + '{transition:none!important;}}';
    (document.head || document.documentElement).appendChild(css);

    const root = document.documentElement;

    // Prefer the native navigation root; include alternate IDs/attributes used in Twitch layouts.
    const NAV_SELECTORS = [
        '#side-nav',
        '#sideNav',
        '[aria-label="Left Navigation"]',
        '[aria-label*="Left Navigation" i]',
        '[data-test-selector="side-nav"]',
        '.side-bar-contents nav',
        'nav[data-a-target="side-nav-bar"]',
        '[data-a-target="side-nav-bar"]',
        '.side-nav'
    ];

    const THEATER_SELECTORS = [
        '.channel-root__scroll-area--theatre-mode',
        '.twilight-main--theatre',
        '[class*="theatre--"]',
        '[class*="theater--"]',
        '[data-a-target="player-overlay-click-handler"][class*="theatre"]',
        '.channel-root--theatre',
        '.channel-root--theater',
        '[class*="channel-root"][class*="theatre"]',
        '[class*="channel-root"][class*="theater"]',
        'button[aria-label*="Exit Theatre Mode" i]',
        'button[aria-label*="Exit Theater Mode" i]',
        'button[title*="Exit Theatre Mode" i]',
        'button[title*="Exit Theater Mode" i]'
    ];

    let nativeNav = null;
    let theaterMode = false;
    let edgeFallback = false;
    let open = false;
    let expandedByUs = false;
    let savedTop = null;
    let showTimer = null;
    let hideTimer = null;
    let collapseTimer = null;

    function getNavCandidate() {
        for (const selector of NAV_SELECTORS) {
            let el = null;
            try { el = document.querySelector(selector); } catch (_) {}
            if (!el || !el.isConnected) continue;
            if (el.querySelector('a[href], [data-a-target*="side-nav-card"]')) return el;
        }
        return null;
    }

    function onChannelRoute() {
        const path = location.pathname.split('/').filter(Boolean);
        if (path.length !== 1) return false;
        const reserved = new Set([
            'directory', 'downloads', 'inventory', 'settings', 'wallet',
            'subscriptions', 'turbo', 'videos', 'search', 'jobs', 'p',
            'moderator', 'popout', 'embed', 'login', 'signup'
        ]);
        return !reserved.has(path[0].toLowerCase());
    }

    function hasPlayer() {
        return !!document.querySelector(
            'video, .video-player, [data-a-target="video-player"], ' +
            '[data-a-target="player-overlay-click-handler"], #channel-player'
        );
    }

    function detectTheater() {
        for (const selector of THEATER_SELECTORS) {
            try {
                if (document.querySelector(selector)) return true;
            } catch (_) {}
        }

        // Twitch sometimes renames the theater root. This read-only scan runs only on a timer.
        for (const el of document.querySelectorAll('[class*="theatre"],[class*="theater"]')) {
            const cls = typeof el.className === 'string'
                ? el.className
                : (el.className && el.className.baseVal) || '';
            if (/(theatre|theater)/i.test(cls) && !/tts30/i.test(cls)) return true;
        }

        // Fallback for a wide player on a channel route when Twitch changes class names.
        if (!onChannelRoute()) return false;
        const player = document.querySelector(
            '.video-player, [data-a-target="video-player"], ' +
            '[data-a-target="player-overlay-click-handler"], #channel-player'
        );
        if (!player) return false;
        const rect = player.getBoundingClientRect();
        return rect.width >= window.innerWidth * 0.68 &&
               rect.height >= window.innerHeight * 0.40;
    }

    function calculateTop(nav) {
        const rect = nav.getBoundingClientRect();
        if (rect.top > 1 && rect.top < window.innerHeight * 0.5) return Math.round(rect.top);

        const top = document.querySelector(
            '#top-nav, [data-a-target="top-nav-container"], .top-nav, .top-bar'
        );
        if (top) {
            const r = top.getBoundingClientRect();
            if (r.height > 0 && r.bottom > 0 && r.bottom < 180) return Math.round(r.bottom);
        }
        return 0;
    }

    function restoreTop(nav) {
        if (!nav || !savedTop) return;
        if (savedTop.value) {
            nav.style.setProperty('--tts30-top', savedTop.value, savedTop.priority);
        } else {
            nav.style.removeProperty('--tts30-top');
        }
        savedTop = null;
    }

    function restoreNav() {
        if (!nativeNav) return;
        nativeNav.classList.remove(OPEN_CLASS, NAV_CLASS);
        restoreTop(nativeNav);
        nativeNav = null;
    }

    function styleNativeNav(nav) {
        if (!nav) return false;
        if (nativeNav === nav && nav.classList.contains(NAV_CLASS)) {
            root.classList.add(ROOT_CLASS);
            return true;
        }

        restoreNav();
        nativeNav = nav;
        savedTop = {
            value: nav.style.getPropertyValue('--tts30-top'),
            priority: nav.style.getPropertyPriority('--tts30-top')
        };
        nav.style.setProperty('--tts30-top', calculateTop(nav) + 'px');
        root.classList.add(ROOT_CLASS);
        nav.classList.add(NAV_CLASS);
        return true;
    }

    function toggleButton(nav) {
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
        const button = toggleButton(nav);
        return !!button && button.getAttribute('aria-expanded') === 'false';
    }

    function clearTimers() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        clearTimeout(collapseTimer);
        showTimer = hideTimer = collapseTimer = null;
    }

    function afterClose() {
        if (expandedByUs) {
            const button = toggleButton(nativeNav);
            if (button && nativeNav && nativeNav.isConnected && !isCollapsed(nativeNav)) button.click();
            expandedByUs = false;
        }
        if (edgeFallback && !theaterMode && !open) {
            edgeFallback = false;
            root.classList.remove(ROOT_CLASS);
            restoreNav();
        }
    }

    function closeNav(immediate = false) {
        clearTimeout(showTimer);
        showTimer = null;
        clearTimeout(hideTimer);
        hideTimer = null;

        if (!nativeNav) {
            open = false;
            return;
        }

        nativeNav.classList.remove(OPEN_CLASS);
        open = false;
        clearTimeout(collapseTimer);
        collapseTimer = setTimeout(afterClose, immediate ? 0 : CFG.animation + 35);
    }

    function openNav() {
        showTimer = null;
        if (!theaterMode && !edgeFallback) return;

        const current = getNavCandidate();
        if (current && current !== nativeNav) styleNativeNav(current);
        if (!nativeNav || !nativeNav.isConnected) return;

        clearTimeout(collapseTimer);
        collapseTimer = null;

        if (isCollapsed(nativeNav)) {
            const button = toggleButton(nativeNav);
            if (button) {
                button.click();
                expandedByUs = true;
            }
        }

        nativeNav.classList.add(NAV_CLASS, OPEN_CLASS);
        root.classList.add(ROOT_CLASS);
        open = true;
    }

    function scheduleOpen() {
        clearTimeout(hideTimer);
        hideTimer = null;
        if (open || showTimer !== null) return;
        showTimer = setTimeout(openNav, CFG.showDelay);
    }

    function scheduleClose() {
        if (!open || hideTimer !== null) return;
        hideTimer = setTimeout(() => {
            hideTimer = null;
            if (nativeNav && nativeNav.matches(':hover')) return;
            closeNav(false);
        }, CFG.hideDelay);
    }

    function activateTheater() {
        theaterMode = true;
        edgeFallback = false;
        root.classList.add(ROOT_CLASS);
        const candidate = getNavCandidate();
        if (candidate) styleNativeNav(candidate);
    }

    function deactivateTheater() {
        theaterMode = false;
        closeNav(true);
        if (!edgeFallback) {
            root.classList.remove(ROOT_CLASS);
            restoreNav();
            expandedByUs = false;
        }
    }

    function sync() {
        const detected = detectTheater();
        if (detected) {
            if (!theaterMode) activateTheater();
            const candidate = getNavCandidate();
            if (candidate && candidate !== nativeNav) styleNativeNav(candidate);
            if (nativeNav && nativeNav.isConnected && !nativeNav.classList.contains(NAV_CLASS)) {
                nativeNav.classList.add(NAV_CLASS);
            }
            return;
        }

        if (!edgeFallback) {
            if (theaterMode || nativeNav) deactivateTheater();
            return;
        }

        const candidate = getNavCandidate();
        if (candidate && candidate !== nativeNav) styleNativeNav(candidate);
    }

    document.addEventListener('mousemove', event => {
        if (event.clientX <= CFG.edge) {
            // Check mode at the actual edge event, then fall back to the existing nav
            // on a live channel if Twitch has changed its theater-mode class names.
            if (!theaterMode && detectTheater()) activateTheater();

            if (!theaterMode && !edgeFallback && onChannelRoute() && hasPlayer()) {
                const candidate = getNavCandidate();
                if (candidate) {
                    edgeFallback = true;
                    styleNativeNav(candidate);
                }
            }

            if (theaterMode || edgeFallback) {
                const candidate = getNavCandidate();
                if (candidate && candidate !== nativeNav) styleNativeNav(candidate);
                scheduleOpen();
            }
        } else if (open && nativeNav && !nativeNav.contains(event.target)) {
            scheduleClose();
        }
    }, { passive: true });

    document.addEventListener('pointerdown', event => {
        if (open && nativeNav && !nativeNav.contains(event.target)) closeNav(true);
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && open) closeNav(true);
    });

    document.addEventListener('mouseover', event => {
        if (!open || !nativeNav || !nativeNav.contains(event.target)) return;
        clearTimeout(hideTimer);
        hideTimer = null;
        clearTimeout(collapseTimer);
        collapseTimer = null;
    }, true);

    // Poll only; never observe Twitch's continuously changing React tree.
    window.setInterval(sync, CFG.poll);
    sync();
})();
