// ==UserScript==
// @name         Twitch Theater Sidebar on Hover
// @namespace    https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @homepageURL  https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @supportURL   https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/issues
// @version      5.2.0
// @description  Auto-collapse Twitch's native sidebar in theater mode and reveal its icon rail on hover.
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

    const CONFIG = Object.freeze({
        edgeWidth: 28,
        panelWidthFallback: 240,
        showDelay: 65,
        hideDelay: 260,
        animationMs: 250,
        statePollMs: 500
    });

    const ROOT_CLASS = 'tts-hover-theater';
    const HOST_CLASS = 'tts-hover-host';
    const OPEN_CLASS = 'tts-hover-open';
    const STYLE_ID = 'tts-hover-style';

    // Remove UI/styles created by previous experimental builds.
    [
        'tts4-toolbar',
        'tts4-style',
        'tts30-style',
        'twitch-theater-sidebar-style',
        'twitch-theater-sidebar-panel',
        'twitch-theater-sidebar-trigger',
        STYLE_ID
    ].forEach(id => document.getElementById(id)?.remove());

    document.documentElement.classList.remove('tts-theater-mode-active', 'tts30-layout');
    document.querySelectorAll(
        '.tts4-force, .tts4-force-parent, .tts4-outline, ' +
        '.tts-native-sidebar, .tts-native-sidebar-open, .tts30-native-nav, .tts30-open'
    ).forEach(element => {
        element.classList.remove(
            'tts4-force',
            'tts4-force-parent',
            'tts4-outline',
            'tts-native-sidebar',
            'tts-native-sidebar-open',
            'tts30-native-nav',
            'tts30-open'
        );
    });

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
        'html.' + ROOT_CLASS + ' .' + HOST_CLASS + ' {' +
            'position:fixed!important;' +
            'top:0!important;left:0!important;right:auto!important;bottom:0!important;' +
            'width:min(var(--tts-hover-width,' + CONFIG.panelWidthFallback + 'px),88vw)!important;' +
            'min-width:min(var(--tts-hover-width,' + CONFIG.panelWidthFallback + 'px),88vw)!important;' +
            'max-width:88vw!important;' +
            'height:100vh!important;height:100dvh!important;' +
            'min-height:0!important;max-height:100vh!important;max-height:100dvh!important;' +
            'margin:0!important;box-sizing:border-box!important;' +
            'display:flex!important;flex-direction:column!important;align-items:stretch!important;' +
            'overflow:visible!important;visibility:visible!important;opacity:1!important;' +
            'z-index:2147483000!important;background:var(--tts-hover-bg,#26262c)!important;' +
            'transform:translate3d(calc(-100% - 14px),0,0)!important;' +
            'transition:transform ' + CONFIG.animationMs + 'ms cubic-bezier(.22,1,.36,1),width 140ms ease,min-width 140ms ease,box-shadow ' + CONFIG.animationMs + 'ms ease!important;' +
            'pointer-events:none!important;will-change:transform,width;' +
        '}' +
        'html.' + ROOT_CLASS + ' .' + HOST_CLASS + '.' + OPEN_CLASS + ' {' +
            'transform:translate3d(0,0,0)!important;pointer-events:auto!important;' +
            'box-shadow:5px 0 24px rgba(0,0,0,.38)!important;' +
        '}' +
        '@media(prefers-reduced-motion:reduce){html.' + ROOT_CLASS + ' .' + HOST_CLASS + '{transition:none!important;}}';
    (document.head || document.documentElement).appendChild(style);

    const NAV_SELECTOR = '#side-nav';
    const THEATER_SELECTORS = [
        '.channel-root__scroll-area--theatre-mode',
        '.twilight-main--theatre',
        '.channel-root--theatre',
        '.channel-root--theater',
        '[class*="channel-root"][class*="theatre"]',
        '[class*="channel-root"][class*="theater"]'
    ];

    let activeNav = null;
    let activeHost = null;
    let originalHostProperties = null;
    let expandedWidth = CONFIG.panelWidthFallback;
    let collapsedWidth = 56;
    let isTheater = false;
    let sidebarWasExpandedBeforeTheater = null;
    let isOpen = false;
    let showTimer = null;
    let hideTimer = null;
    let syncTimer = null;

    function findNav() {
        return document.querySelector(NAV_SELECTOR) ||
            document.querySelector('[aria-label="Левая панель"]') ||
            document.querySelector('[aria-label="Left Navigation"]');
    }

    function findHost(nav) {
        if (!nav) return null;
        // On the confirmed Twitch layout, the .side-nav parent is the layer which
        // must escape the stream stage's overflow/stacking context.
        const sideNav = nav.closest('.side-nav') || nav;
        return sideNav.parentElement || sideNav;
    }

    function theaterModeDetected() {
        return THEATER_SELECTORS.some(selector => document.querySelector(selector) !== null);
    }

    function clearTimers() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        showTimer = null;
        hideTimer = null;
    }

    function restoreHostProperties(host) {
        if (!host || !originalHostProperties) return;
        for (const [property, saved] of Object.entries(originalHostProperties)) {
            if (saved.value) host.style.setProperty(property, saved.value, saved.priority);
            else host.style.removeProperty(property);
        }
        originalHostProperties = null;
    }

    function isSidebarCollapsed(nav) {
        if (!nav) return false;
        const sideNav = nav.closest('.side-nav') || nav;
        return sideNav.classList.contains('side-nav--collapsed') ||
            nav.classList.contains('side-nav--collapsed');
    }

    function findSidebarToggle(nav) {
        const sideNav = nav && (nav.closest('.side-nav') || nav);
        return (sideNav && sideNav.querySelector('[data-a-target="side-nav-arrow"]')) ||
            document.querySelector('[data-a-target="side-nav-arrow"]');
    }

    function ensureNativeSidebarCollapsed(nav) {
        if (!nav) return;

        // Capture the user's original preference once, then keep the native Twitch
        // sidebar collapsed for the whole theater-mode session.
        if (sidebarWasExpandedBeforeTheater === null) {
            sidebarWasExpandedBeforeTheater = !isSidebarCollapsed(nav);
        }
        if (isSidebarCollapsed(nav)) return;

        const toggle = findSidebarToggle(nav);
        if (!toggle || toggle.disabled) return;

        toggle.click();

        // Twitch updates the collapsed class during its React render. Re-measure
        // after that render so the wrapper shrinks with the actual native icon rail.
        [60, 160, 320].forEach(delay => {
            window.setTimeout(() => {
                if (!isTheater) return;
                const currentNav = findNav();
                // Avoid a second toggle while Twitch is still processing the first one.
                if (currentNav && isSidebarCollapsed(currentNav)) {
                    syncState();
                    syncHostWidth();
                }
            }, delay);
        });
    }

    function restoreNativeSidebarState() {
        const shouldBeExpanded = sidebarWasExpandedBeforeTheater;
        sidebarWasExpandedBeforeTheater = null;
        if (shouldBeExpanded === null) return;

        const nav = findNav();
        if (!nav) return;

        const currentlyExpanded = !isSidebarCollapsed(nav);
        if (currentlyExpanded === shouldBeExpanded) return;

        const toggle = findSidebarToggle(nav);
        if (toggle && !toggle.disabled) toggle.click();
    }

    function readSidebarBackground(nav) {
        const sideNav = nav && (nav.closest('.side-nav') || nav);
        if (!sideNav) return '#26262c';
        const background = getComputedStyle(sideNav).backgroundColor;
        return background && background !== 'rgba(0, 0, 0, 0)' ? background : '#26262c';
    }

    function syncHostWidth() {
        if (!activeHost || !activeNav || !activeHost.isConnected || !activeNav.isConnected) return;
        const sideNav = activeNav.closest('.side-nav') || activeNav;
        const measured = sideNav.getBoundingClientRect().width;
        if (isSidebarCollapsed(activeNav)) {
            const width = measured >= 42 && measured <= 144 ? Math.round(measured) : collapsedWidth;
            activeHost.style.setProperty('--tts-hover-width', width + 'px');
        } else {
            activeHost.style.setProperty('--tts-hover-width', expandedWidth + 'px');
        }
        activeHost.style.setProperty('--tts-hover-bg', readSidebarBackground(activeNav));
    }

    function releaseHost() {
        if (activeHost) {
            activeHost.classList.remove(OPEN_CLASS, HOST_CLASS);
            restoreHostProperties(activeHost);
        }
        activeHost = null;
        activeNav = null;
        isOpen = false;
    }

    function deactivateTheater() {
        clearTimers();
        // Removing the root class disables every temporary rule, then restores
        // the host's original position/layout. No Twitch layout styles are retained.
        document.documentElement.classList.remove(ROOT_CLASS);
        releaseHost();
        isTheater = false;
        restoreNativeSidebarState();
    }

    function activateHost(nav, host) {
        const wasOpen = isOpen;
        releaseHost();

        activeNav = nav;
        activeHost = host;

        const sideNav = nav.closest('.side-nav') || nav;
        const measuredWidth = Math.ceil(Math.max(
            sideNav.getBoundingClientRect().width || 0,
            host.getBoundingClientRect().width || 0,
            CONFIG.panelWidthFallback
        ));
        expandedWidth = Math.min(Math.max(measuredWidth, 180), 360);
        const measuredCollapsedWidth = sideNav.getBoundingClientRect().width;
        collapsedWidth = measuredCollapsedWidth >= 42 && measuredCollapsedWidth <= 144
            ? Math.round(measuredCollapsedWidth)
            : 56;
        const currentCollapsed = isSidebarCollapsed(nav);

        originalHostProperties = {
            '--tts-hover-width': {
                value: host.style.getPropertyValue('--tts-hover-width'),
                priority: host.style.getPropertyPriority('--tts-hover-width')
            },
            '--tts-hover-bg': {
                value: host.style.getPropertyValue('--tts-hover-bg'),
                priority: host.style.getPropertyPriority('--tts-hover-bg')
            }
        };

        host.style.setProperty('--tts-hover-width', (currentCollapsed ? collapsedWidth : expandedWidth) + 'px');
        host.style.setProperty('--tts-hover-bg', readSidebarBackground(nav));
        document.documentElement.classList.add(ROOT_CLASS);
        host.classList.add(HOST_CLASS);
        syncHostWidth();

        if (wasOpen) scheduleOpen();
    }

    function syncState() {
        const detected = theaterModeDetected();

        if (!detected) {
            if (isTheater || activeHost) deactivateTheater();
            return;
        }

        isTheater = true;
        const nav = findNav();
        if (!nav) {
            if (activeHost) releaseHost();
            return;
        }

        ensureNativeSidebarCollapsed(nav);

        const host = findHost(nav);
        if (!host) return;

        if (host !== activeHost) {
            activateHost(nav, host);
            return;
        }

        // Twitch can replace classes during React renders. Re-apply only our own
        // classes and never overwrite Twitch's original layout styles.
        document.documentElement.classList.add(ROOT_CLASS);
        activeHost.classList.add(HOST_CLASS);
        syncHostWidth();
        if (isOpen) activeHost.classList.add(OPEN_CLASS);
    }

    function scheduleOpen() {
        if (!isTheater) return;
        clearTimeout(hideTimer);
        hideTimer = null;
        if (isOpen || showTimer !== null) return;

        showTimer = setTimeout(() => {
            showTimer = null;

            if (!theaterModeDetected()) {
                syncState();
                return;
            }

            const nav = findNav();
            if (!nav) return;
            const host = findHost(nav);
            if (!host) return;

            if (host !== activeHost) activateHost(nav, host);
            if (!activeHost) return;

            activeHost.classList.add(OPEN_CLASS);
            isOpen = true;
        }, CONFIG.showDelay);
    }

    function closePanel() {
        clearTimeout(showTimer);
        showTimer = null;
        clearTimeout(hideTimer);
        hideTimer = null;
        if (activeHost) activeHost.classList.remove(OPEN_CLASS);
        isOpen = false;
    }

    function scheduleClose() {
        if (!isOpen || hideTimer !== null) return;
        hideTimer = setTimeout(() => {
            hideTimer = null;
            if (activeHost && activeHost.matches(':hover')) return;
            closePanel();
        }, CONFIG.hideDelay);
    }

    document.addEventListener('mousemove', event => {
        if (event.clientX <= CONFIG.edgeWidth) {
            // Detect mode at the edge event as well as in the low-frequency poll.
            if (!isTheater && theaterModeDetected()) syncState();

            if (isTheater && theaterModeDetected()) {
                const nav = findNav();
                const host = findHost(nav);
                if (nav && host && host !== activeHost) activateHost(nav, host);
                scheduleOpen();
            }
        } else if (isOpen && activeHost && !activeHost.contains(event.target)) {
            scheduleClose();
        }
    }, { passive: true });

    document.addEventListener('mouseover', event => {
        if (!activeHost || !activeHost.contains(event.target)) return;
        clearTimeout(hideTimer);
        hideTimer = null;
    }, true);

    document.addEventListener('mouseout', event => {
        if (activeHost && isOpen && activeHost.contains(event.target) &&
            !activeHost.contains(event.relatedTarget)) {
            scheduleClose();
        }
    }, true);

    // Close the temporary layout immediately when Twitch's theater-mode toggle is clicked.
    // The poll below remains a fallback for keyboard/SPA-driven state changes.
    document.addEventListener('click', event => {
        const toggle = event.target && event.target.closest
            ? event.target.closest(
                '[data-a-target="player-theatre-mode-button"],' +
                '[data-a-target="player-theater-mode-button"],' +
                'button[aria-label*="Exit Theatre Mode" i],' +
                'button[aria-label*="Exit Theater Mode" i],' +
                'button[title*="Exit Theatre Mode" i],' +
                'button[title*="Exit Theater Mode" i]'
            )
            : null;
        if (!toggle) return;
        window.setTimeout(() => { syncState(); syncHostWidth(); }, 0);
        window.setTimeout(() => { syncState(); syncHostWidth(); }, 160);
        window.setTimeout(() => { syncState(); syncHostWidth(); }, 340);
    }, true);

    document.addEventListener('pointerdown', event => {
        if (isOpen && activeHost && !activeHost.contains(event.target)) closePanel();
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isOpen) closePanel();
    });

    // Poll for theater toggles and Twitch SPA replacing the navigation; no observer.
    syncState();
    syncTimer = window.setInterval(() => {
        syncState();
        syncHostWidth();
    }, CONFIG.statePollMs);

    window.addEventListener('pagehide', () => {
        clearTimers();
        if (syncTimer !== null) clearInterval(syncTimer);
        document.documentElement.classList.remove(ROOT_CLASS);
        releaseHost();
    }, { once: true });
})();
