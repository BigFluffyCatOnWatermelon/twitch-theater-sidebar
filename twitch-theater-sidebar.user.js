// ==UserScript==
// @name         Twitch Theater Sidebar on Hover
// @namespace    https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @version      1.0.0
// @description  Reveals Twitch's stream sidebar when hovering the left edge in theater mode.
// @match        https://www.twitch.tv/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    const CONFIG = {
        triggerWidth: 22,
        sidebarWidth: 260,
        showDelay: 90,
        hideDelay: 280,
        statePollMs: 750,
        refreshDelayMs: 120
    };

    const IDS = {
        style: 'twitch-theater-sidebar-style',
        panel: 'twitch-theater-sidebar-panel',
        trigger: 'twitch-theater-sidebar-trigger'
    };

    // Avoid duplicate UI if the script is injected more than once.
    if (document.getElementById(IDS.panel)) return;

    const style = document.createElement('style');
    style.id = IDS.style;
    style.textContent = `
        #twitch-theater-sidebar-trigger {
            position: fixed;
            top: 0;
            left: 0;
            width: ${CONFIG.triggerWidth}px;
            height: 100vh;
            height: 100dvh;
            z-index: 999997;
            pointer-events: none;
        }

        #twitch-theater-sidebar-trigger::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 0;
            width: 3px;
            height: 58px;
            border-radius: 0 3px 3px 0;
            background: rgba(145, 71, 255, 0.7);
            transform: translateY(-50%);
            opacity: 0;
            transition: opacity 160ms ease;
        }

        #twitch-theater-sidebar-trigger[data-active="true"]::after {
            opacity: 1;
        }

        #twitch-theater-sidebar-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: ${CONFIG.sidebarWidth}px;
            max-width: min(${CONFIG.sidebarWidth}px, 88vw);
            height: 100vh;
            height: 100dvh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            z-index: 999999;
            color: var(--color-text-base, #efeff1);
            background: var(--color-background-base, #0e0e10);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 5px 0 24px rgba(0, 0, 0, 0.45);
            transform: translateX(calc(-100% - 14px));
            transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
            pointer-events: none;
            contain: layout style;
        }

        #twitch-theater-sidebar-panel.tts-visible {
            transform: translateX(0);
            pointer-events: auto;
        }

        #twitch-theater-sidebar-panel,
        #twitch-theater-sidebar-panel * {
            box-sizing: border-box;
        }

        #twitch-theater-sidebar-panel .tts-header {
            min-height: 48px;
            flex: 0 0 48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 0 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.09);
            background: var(--color-background-base, #0e0e10);
        }

        #twitch-theater-sidebar-panel .tts-heading {
            margin: 0;
            color: var(--color-text-alt-2, #adadb8);
            font-size: 11px;
            line-height: 1.3;
            font-weight: 700;
            letter-spacing: 0.11em;
            text-transform: uppercase;
        }

        #twitch-theater-sidebar-panel .tts-close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            padding: 0;
            border: 0;
            border-radius: 4px;
            color: var(--color-text-alt-2, #adadb8);
            background: transparent;
            font: inherit;
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
        }

        #twitch-theater-sidebar-panel .tts-close:hover {
            color: var(--color-text-base, #efeff1);
            background: rgba(255, 255, 255, 0.09);
        }

        #twitch-theater-sidebar-panel .tts-content {
            min-height: 0;
            flex: 1 1 auto;
            overflow: auto;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.22) transparent;
        }

        #twitch-theater-sidebar-panel .tts-content > * {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
            transform: none !important;
        }

        #twitch-theater-sidebar-panel .tts-content .side-nav,
        #twitch-theater-sidebar-panel .tts-content [data-a-target="side-nav-bar"],
        #twitch-theater-sidebar-panel .tts-content [data-test-selector="side-nav"] {
            position: static !important;
            display: block !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            overflow: visible !important;
            transform: none !important;
        }

        #twitch-theater-sidebar-panel .tts-content .side-nav-section {
            width: 100% !important;
        }

        #twitch-theater-sidebar-panel .tts-content a {
            cursor: pointer;
        }

        #twitch-theater-sidebar-panel .tts-content [data-a-target="side-nav-arrow"],
        #twitch-theater-sidebar-panel .tts-content [data-a-target="side-nav-show-more-button"],
        #twitch-theater-sidebar-panel .tts-content [data-a-target="side-nav-show-less-button"],
        #twitch-theater-sidebar-panel .tts-content .skip-to-target {
            display: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
            #twitch-theater-sidebar-panel {
                transition: none;
            }
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    const trigger = document.createElement('div');
    trigger.id = IDS.trigger;
    trigger.setAttribute('aria-hidden', 'true');
    trigger.dataset.active = 'false';
    document.body.appendChild(trigger);

    const panel = document.createElement('aside');
    panel.id = IDS.panel;
    panel.setAttribute('aria-label', 'Панель трансляций');
    panel.innerHTML =
        '<div class="tts-header">' +
            '<h2 class="tts-heading">Трансляции</h2>' +
            '<button class="tts-close" type="button" aria-label="Скрыть панель" title="Скрыть панель">×</button>' +
        '</div>' +
        '<div class="tts-content"></div>';
    document.body.appendChild(panel);

    const content = panel.querySelector('.tts-content');
    const closeButton = panel.querySelector('.tts-close');

    const NAV_SELECTORS = [
        '#side-nav',
        '[data-test-selector="side-nav"]',
        '[aria-label="Left Navigation"]',
        '.side-bar-contents nav',
        'nav[data-a-target="side-nav-bar"]'
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

    let theaterMode = false;
    let isVisible = false;
    let showTimer = null;
    let hideTimer = null;
    let refreshTimer = null;
    let observedNav = null;
    let navObserver = null;
    let lastNavSignature = '';

    function findSidebar() {
        for (const selector of NAV_SELECTORS) {
            const element = document.querySelector(selector);
            if (element && !panel.contains(element)) return element;
        }
        return null;
    }

    function isTheaterMode() {
        return THEATER_SELECTORS.some(selector => document.querySelector(selector) !== null);
    }

    function setVisible(visible) {
        isVisible = visible;
        panel.classList.toggle('tts-visible', visible);
    }

    function hideImmediately() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        setVisible(false);
    }

    function showPanel() {
        clearTimeout(hideTimer);
        if (!theaterMode) return;
        refreshSidebar();
        setVisible(true);
    }

    function scheduleShow() {
        clearTimeout(hideTimer);
        if (isVisible || showTimer !== null || !theaterMode) return;
        showTimer = setTimeout(() => {
            showTimer = null;
            showPanel();
        }, CONFIG.showDelay);
    }

    function scheduleHide() {
        clearTimeout(showTimer);
        showTimer = null;
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            hideTimer = null;
            if (!panel.matches(':hover')) setVisible(false);
        }, CONFIG.hideDelay);
    }

    function normalizeRoute(href) {
        try {
            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin) return null;
            return url.pathname + url.search + url.hash;
        } catch (_) {
            return null;
        }
    }

    function refreshSidebar() {
        const nav = findSidebar();
        if (!nav) {
            if (content.childElementCount) content.replaceChildren();
            lastNavSignature = '';
            return;
        }

        const signature = String(nav.className || '') + '|' + nav.innerHTML;
        if (signature === lastNavSignature && content.firstElementChild) return;

        const clone = nav.cloneNode(true);
        clone.removeAttribute('id');
        clone.removeAttribute('style');

        // Do not duplicate IDs from Twitch's live DOM inside the overlay.
        clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));

        // Expanded layout is required even if Twitch's real sidebar is collapsed.
        [clone, ...clone.querySelectorAll('[class]')].forEach(element => {
            Array.from(element.classList).forEach(className => {
                if (/collapsed/i.test(className)) element.classList.remove(className);
            });
        });

        clone.querySelectorAll(
            '[data-a-target="side-nav-arrow"],' +
            '[data-a-target="side-nav-show-more-button"],' +
            '[data-a-target="side-nav-show-less-button"],' +
            '.skip-to-target'
        ).forEach(element => element.remove());

        content.replaceChildren(clone);
        lastNavSignature = signature;
    }

    function scheduleSidebarRefresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshSidebar, CONFIG.refreshDelayMs);
    }

    function bindSidebarObserver() {
        const nav = findSidebar();
        if (nav === observedNav) return;

        if (navObserver) navObserver.disconnect();
        navObserver = null;
        observedNav = nav;
        lastNavSignature = '';

        if (nav) {
            navObserver = new MutationObserver(scheduleSidebarRefresh);
            navObserver.observe(nav, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        }

        scheduleSidebarRefresh();
    }

    function updateTheaterState() {
        const nextState = isTheaterMode();
        if (nextState === theaterMode) return;

        theaterMode = nextState;
        trigger.dataset.active = nextState ? 'true' : 'false';

        if (!nextState) hideImmediately();
    }

    // A narrow edge zone reveals the panel only while Twitch is in theater mode.
    document.addEventListener('mousemove', event => {
        if (!theaterMode) return;

        if (event.clientX <= CONFIG.triggerWidth) {
            scheduleShow();
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    }, { passive: true });

    panel.addEventListener('mouseenter', () => {
        clearTimeout(hideTimer);
        hideTimer = null;
    });

    panel.addEventListener('mouseleave', scheduleHide);

    closeButton.addEventListener('click', hideImmediately);

    content.addEventListener('click', event => {
        const anchor = event.target.closest('a[href]');
        if (!anchor || !content.contains(anchor)) return;

        // Preserve the browser's normal behavior for new tabs and modified clicks.
        if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            (anchor.target && anchor.target !== '_self')
        ) {
            return;
        }

        const targetRoute = normalizeRoute(anchor.href);
        if (!targetRoute) return;

        event.preventDefault();
        event.stopPropagation();
        hideImmediately();

        // Clicking the original Twitch anchor keeps navigation inside Twitch's SPA.
        const liveNav = findSidebar();
        const originalAnchor = liveNav
            ? Array.from(liveNav.querySelectorAll('a[href]')).find(
                link => normalizeRoute(link.href) === targetRoute
            )
            : null;

        if (originalAnchor) {
            originalAnchor.click();
        } else {
            window.location.assign(new URL(anchor.href, window.location.href).href);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isVisible) hideImmediately();
    });

    document.addEventListener('click', event => {
        if (isVisible && !panel.contains(event.target)) hideImmediately();
    });

    // Twitch is a single-page app; polling also catches theater-mode toggles and route changes.
    updateTheaterState();
    bindSidebarObserver();

    window.setInterval(() => {
        updateTheaterState();
        bindSidebarObserver();
    }, CONFIG.statePollMs);
})();
