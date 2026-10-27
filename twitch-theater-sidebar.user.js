// ==UserScript==
// @name         Twitch Theater Sidebar on Hover
// @namespace    https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @homepageURL  https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @supportURL   https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/issues
// @version      5.4.3
// @description  Theater-mode sidebar with fast cached thumbnail previews and configurable controls.
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
    const INSTANT_CLASS = 'tts-hover-instant';
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
    document.querySelectorAll(
        '#tts-channel-preview, #tts-settings-panel, #tts-settings-backdrop, ' +
        '#tts-settings-menu-item, #tts-settings-menu-separator'
    ).forEach(element => element.remove());

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
            'transition:transform var(--tts-hover-animation-ms,' + CONFIG.animationMs + 'ms) cubic-bezier(.22,1,.36,1),width 140ms ease,min-width 140ms ease,box-shadow var(--tts-hover-animation-ms,' + CONFIG.animationMs + 'ms) ease!important;' +
            'pointer-events:none!important;will-change:transform,width;' +
        '}' +
        // The host is moved from Twitch's normal layout into a fixed off-screen
        // position on activation. Disable transitions for that first layout change,
        // otherwise the expanded sidebar animates across the screen and flashes.
        'html.' + ROOT_CLASS + ' .' + HOST_CLASS + '.' + INSTANT_CLASS + '{transition:none!important;}' +
        'html.' + ROOT_CLASS + ' .' + HOST_CLASS + '.' + OPEN_CLASS + ' {' +
            'transform:translate3d(0,0,0)!important;pointer-events:auto!important;' +
            'box-shadow:5px 0 24px rgba(0,0,0,.38)!important;' +
        '}' +
        // These switches affect only channel-card copy while the theater sidebar is active.
        // Keep native avatars, channel titles, viewer counts and the collapse control intact.
        'html.' + ROOT_CLASS + '.tts-hide-descriptions #side-nav .side-nav-card__description,' +
        'html.' + ROOT_CLASS + '.tts-hide-descriptions #side-nav [data-a-target="side-nav-card-description"],' +
        'html.' + ROOT_CLASS + '.tts-hide-descriptions #side-nav .side-nav-card__stream-title,' +
        'html.' + ROOT_CLASS + '.tts-hide-descriptions #side-nav .side-nav-card__subtitle,' +
        'html.' + ROOT_CLASS + '.tts-hide-descriptions #side-nav [data-a-target="side-nav-card-subtitle"],' +
        'html.' + ROOT_CLASS + '.tts-hide-descriptions #side-nav .side-nav-card__preview,' +
        'html.' + ROOT_CLASS + '.tts-hide-descriptions #side-nav .side-nav-card__details > :not(.side-nav-card__title):not(.side-nav-card__metadata):not(:has(.side-nav-card__title)):not(:has(.side-nav-card__viewers)):not(:has([data-a-target="side-nav-card-viewers"])){' +
            'display:none!important;' +
        '}' +
        'html.' + ROOT_CLASS + '.tts-hide-categories #side-nav .side-nav-card__category,' +
        'html.' + ROOT_CLASS + '.tts-hide-categories #side-nav [data-a-target="side-nav-card-category"],' +
        'html.' + ROOT_CLASS + '.tts-hide-categories #side-nav .side-nav-card__game,' +
        'html.' + ROOT_CLASS + '.tts-hide-categories #side-nav .side-nav-card__metadata > :not(.side-nav-card__viewers):not([data-a-target="side-nav-card-viewers"]):not(:has(.side-nav-card__viewers)):not(:has([data-a-target="side-nav-card-viewers"])){' +
            'display:none!important;' +
        '}' +
        'html.' + ROOT_CLASS + '.tts-no-smooth-animation .' + HOST_CLASS + '{transition:none!important;}' +
        '@media(prefers-reduced-motion:reduce){html.' + ROOT_CLASS + ' .' + HOST_CLASS + '{transition:none!important;}}';
    (document.head || document.documentElement).appendChild(style);

    style.textContent +=
        '#tts-channel-preview{' +
            'position:fixed;display:none;width:var(--tts-preview-width,360px);max-width:calc(100vw - 16px);'
            'z-index:2147483647;background:#18181b;color:#efeff1;' +
            'border:1px solid rgba(255,255,255,.13);border-radius:9px;overflow:hidden;' +
            'box-shadow:0 12px 38px rgba(0,0,0,.55);pointer-events:none;' +
            'font-family:Inter,Roobert,Helvetica Neue,Helvetica,Arial,sans-serif;' +
        '}' +
        '#tts-channel-preview .tts-preview-head{' +
            'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
            'padding:9px 11px;min-height:38px;box-sizing:border-box;' +
        '}' +
        '#tts-channel-preview .tts-preview-name{' +
            'font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
        '}' +
        '#tts-channel-preview .tts-preview-viewers{' +
            'font-size:12px;color:#dedee3;white-space:nowrap;flex-shrink:0;' +
        '}' +
        '#tts-channel-preview .tts-preview-viewers:before{' +
            'content:"";display:inline-block;width:7px;height:7px;border-radius:50%;' +
            'background:#eb0400;margin-right:5px;vertical-align:1px;' +
        '}' +
        '#tts-channel-preview .tts-preview-image{' +
            'display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background-color:#24242b;' +
            'background-size:cover;background-position:center;opacity:0;transition:opacity 80ms ease;' +
        '}' +
        '#tts-channel-preview .tts-preview-image.tts-preview-image-loaded{opacity:1;}' +
        '#tts-settings-backdrop{' +
            'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
            'z-index:2147483646;padding:18px;box-sizing:border-box;background:rgba(0,0,0,.48);' +
        '}' +
        '#tts-settings-panel{' +
            'position:relative;z-index:1;width:480px;max-width:calc(100vw - 28px);' +
            'max-height:min(82vh,760px);overflow:auto;box-sizing:border-box;padding:18px;' +
            'background:#18181b;color:#efeff1;border:1px solid rgba(255,255,255,.13);border-radius:10px;' +
            'box-shadow:0 16px 48px rgba(0,0,0,.62);font:13px/1.4 Inter,Roobert,Helvetica Neue,Helvetica,Arial,sans-serif;' +
        '}' +
        '#tts-settings-panel .tts-settings-heading{' +
            'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
            'font-size:14px;font-weight:700;margin-bottom:11px;' +
        '}' +
        '#tts-settings-panel .tts-settings-close{' +
            'border:0;background:transparent;color:#adadb8;font-size:19px;line-height:1;' +
            'cursor:pointer;padding:0 2px;' +
        '}' +
        '#tts-settings-panel .tts-settings-section + .tts-settings-section{' +
            'margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12);' +
        '}' +
        '#tts-settings-panel .tts-settings-section-title{' +
            'font-size:12px;font-weight:700;letter-spacing:.045em;text-transform:uppercase;' +
            'color:#bf94ff;margin-bottom:3px;' +
        '}' +
        '#tts-settings-panel .tts-settings-section-help{' +
            'font-size:11px;color:#adadb8;margin-bottom:5px;' +
        '}' +
        '#tts-settings-panel .tts-settings-row{' +
            'display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 0;cursor:pointer;' +
        '}' +
        '#tts-settings-panel .tts-settings-row + .tts-settings-row{' +
            'border-top:1px solid rgba(255,255,255,.09);' +
        '}' +
        '#tts-settings-panel .tts-settings-row input{' +
            'margin:2px 0 0;accent-color:#9147ff;flex-shrink:0;width:16px;height:16px;' +
        '}' +
        '#tts-settings-panel .tts-settings-control{' +
            'max-width:145px;min-width:112px;padding:7px 9px;border-radius:5px;' +
            'border:1px solid rgba(255,255,255,.17);background:#26262c;color:#efeff1;font:inherit;' +
        '}' +
        '#tts-settings-panel .tts-settings-row-copy{flex:1;min-width:0;}' +
        '#tts-settings-panel .tts-settings-label{display:block;font-weight:600;}' +
        '#tts-settings-panel .tts-settings-help{display:block;color:#adadb8;font-size:11px;margin-top:2px;}' +
        '#tts-settings-panel .tts-settings-footnote{' +
            'color:#adadb8;font-size:11px;margin-top:14px;' +
        '}' ;

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

    const SETTINGS_KEY = 'tts-theater-sidebar-preferences-v1';
    const DEFAULT_PREFERENCES = Object.freeze({
        previewEnabled: true,
        previewWidth: 360,
        refreshInterval: 30,
        hideDescriptions: true,
        hideCategories: true,
        autoCollapseSidebar: true,
        animationSpeed: 250
    });
    let preferences = loadPreferences();
    let previewCard = null;
    let previewAnchor = null;
    let previewData = null;
    let thumbnailPreloadCache = new Map();
    let settingsPanel = null;
    let settingsBackdrop = null;
    let settingsMenuItem = null;
    let settingsMenuAnchor = null;
    let chatSettingsClickAt = 0;
    let settingsPanelOpen = false;
    applyPreferences();

    function findNav() {
        return document.querySelector(NAV_SELECTOR) ||
            document.querySelector('[aria-label="Левая панель"]') ||
            document.querySelector('[aria-label="Left Navigation"]');
    }

    function findHost(nav) {
        if (!nav) return null;
        const sideNav = nav.closest('.side-nav') || nav;
        return sideNav.parentElement || sideNav;
    }

    function theaterModeDetected() {
        return THEATER_SELECTORS.some(selector => document.querySelector(selector) !== null);
    }

    function loadPreferences() {
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
            return {
                previewEnabled: typeof saved.previewEnabled === 'boolean' ? saved.previewEnabled : DEFAULT_PREFERENCES.previewEnabled,
                previewWidth: [280, 360, 440].includes(Number(saved.previewWidth)) ? Number(saved.previewWidth) : DEFAULT_PREFERENCES.previewWidth,
                refreshInterval: [30, 60, 120].includes(Number(saved.refreshInterval)) ? Number(saved.refreshInterval) : DEFAULT_PREFERENCES.refreshInterval,
                hideDescriptions: typeof saved.hideDescriptions === 'boolean' ? saved.hideDescriptions : DEFAULT_PREFERENCES.hideDescriptions,
                hideCategories: typeof saved.hideCategories === 'boolean' ? saved.hideCategories : DEFAULT_PREFERENCES.hideCategories,
                autoCollapseSidebar: typeof saved.autoCollapseSidebar === 'boolean' ? saved.autoCollapseSidebar : DEFAULT_PREFERENCES.autoCollapseSidebar,
                animationSpeed: [150, 250, 400].includes(Number(saved.animationSpeed)) ? Number(saved.animationSpeed) : DEFAULT_PREFERENCES.animationSpeed
            };
        } catch (_) {
            return { ...DEFAULT_PREFERENCES };
        }
    }

    function savePreferences() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
        } catch (_) {
            // Keep the current session usable if browser storage is unavailable.
        }
    }

    function applyPreferences() {
        const root = document.documentElement;
        root.classList.toggle('tts-hide-descriptions', !!preferences.hideDescriptions);
        root.classList.toggle('tts-hide-categories', !!preferences.hideCategories);
        root.classList.toggle('tts-no-smooth-animation', !Number(preferences.animationSpeed));
        root.style.setProperty('--tts-hover-animation-ms', (Number(preferences.animationSpeed) || 250) + 'ms');
        root.style.setProperty('--tts-preview-width', (Number(preferences.previewWidth) || 360) + 'px');
        if (previewCard) {
            previewCard.style.width = Math.min(Number(preferences.previewWidth) || 360, window.innerWidth - 16) + 'px';
            positionPreview();
        }
    }

    function visibleElement(element) {
        if (!element || !element.isConnected) return false;
        const rect = element.getBoundingClientRect();
        const css = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 &&
            css.display !== 'none' && css.visibility !== 'hidden' &&
            Number(css.opacity || 1) !== 0;
    }

    function readText(element) {
        return element ? (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim() : '';
    }

    function parseChannelLogin(href) {
        try {
            const path = new URL(href, location.origin).pathname;
            const match = path.match(/^\/([a-zA-Z0-9_]+)\/?$/);
            if (match) {
                const login = match[1];
                const reservedRoutes = new Set([
                    'directory', 'downloads', 'settings', 'subscriptions', 'wallet',
                    'inventory', 'videos', 'clip', 'search', 'jobs', 'p', 'turbo'
                ]);
                if (!reservedRoutes.has(login.toLowerCase())) return login;
            }
        } catch (_) {}
        return '';
    }

    function extractViewerCount(card) {
        if (!card) return '';
        const selectors = [
            '[data-a-target="side-nav-card-viewers"]',
            '[data-a-target*="viewer" i]',
            '.side-nav-card__viewers',
            '[class*="viewers" i]',
            '[aria-label*="viewer" i]',
            '[aria-label*="зрител" i]',
            '[title*="viewer" i]',
            '[title*="зрител" i]'
        ];
        const numberPattern = /(\d+(?:[.,]\d+)*(?:\s*[KMB])?)/i;
        for (const selector of selectors) {
            for (const candidate of card.querySelectorAll(selector)) {
                const combined = [
                    readText(candidate),
                    candidate.getAttribute('aria-label') || '',
                    candidate.getAttribute('title') || ''
                ].join(' ').trim();
                const match = combined.match(numberPattern);
                if (match) return match[1].replace(/\s+/g, '');
            }
        }
        const lines = (card.innerText || card.textContent || '')
            .split(/\n+/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
        for (const line of lines) {
            if (/viewer|watching|зрител/i.test(line)) {
                const match = line.match(numberPattern);
                if (match) return match[1].replace(/\s+/g, '');
            }
        }
        for (const line of lines) {
            if (line.length <= 12 && /^\d+(?:[.,]\d+)?\s*[KMB]?$/i.test(line)) {
                return line.replace(/\s+/g, '');
            }
        }
        return '';
    }

    function extractChannelTitle(card, link, login) {
        const selectors = [
            '.side-nav-card__title',
            '[data-a-target="side-nav-card-title"]',
            'p',
            '[class*="channel-name" i]'
        ];
        for (const selector of selectors) {
            const element = card.querySelector(selector);
            const value = readText(element) ||
                (element && (element.getAttribute('title') || element.getAttribute('aria-label'))) || '';
            if (value) return value.replace(/['’]s profile picture$/i, '').trim();
        }
        const image = link.querySelector('img.tw-image-avatar, img');
        const alt = image && image.getAttribute('alt') || '';
        if (alt && !/profile picture|avatar/i.test(alt)) return alt.trim();
        const label = link.getAttribute('aria-label') || link.getAttribute('title') || '';
        if (label) {
            const cleaned = label.replace(/\s+(?:profile|avatar|channel).*/i, '').trim();
            if (cleaned) return cleaned;
        }
        return login;
    }

    function getChannelHoverHit(target) {
        if (!(target instanceof Element)) return null;
        const avatar = target.closest(
            '#side-nav .side-nav-card__avatar,' +
            '#side-nav .tw-avatar,' +
            '#side-nav img.tw-image-avatar,' +
            '#side-nav [data-a-target="side-nav-card-avatar"]'
        );
        if (!avatar) return null;
        const nav = findNav();
        if (!nav || !nav.contains(avatar)) return null;
        const link = avatar.closest('a[href]');
        if (!link || !nav.contains(link)) return null;

        const login = parseChannelLogin(link.getAttribute('href') || '');
        if (!login) return null;
        const card = link.closest('.side-nav-card, [data-a-target="side-nav-card"]') || link;
        if (avatar.closest('.side-nav-card__avatar--offline') ||
            link.classList.contains('side-nav-card__link--offline')) return null;

        const viewers = extractViewerCount(card);
        const title = extractChannelTitle(card, link, login);
        return { avatar, link, card, login, title, viewers };
    }

    function thumbnailSizeForPreview() {
        const width = Number(preferences.previewWidth) || 360;
        if (width <= 280) return '320x180';
        if (width <= 360) return '440x248';
        return '640x360';
    }

    function thumbnailUrl(login, size = thumbnailSizeForPreview()) {
        const intervalMs = (Number(preferences.refreshInterval) || 30) * 1000;
        const timeBucket = Math.floor(Date.now() / intervalMs);
        return 'https://static-cdn.jtvnw.net/previews-ttv/live_user_' +
            encodeURIComponent(login.toLowerCase()) + '-' + size + '.jpg?t=' + timeBucket;
    }

    function preloadSidebarThumbnails() {
        if (!preferences.previewEnabled || !isTheater) return;
        const nav = findNav();
        if (!nav) return;
        let count = 0;
        for (const link of nav.querySelectorAll('a[href]')) {
            const login = parseChannelLogin(link.getAttribute('href') || '');
            if (!login) continue;
            const card = link.closest('.side-nav-card, [data-a-target="side-nav-card"]') || link;
            if (card.querySelector('.side-nav-card__avatar--offline') ||
                link.classList.contains('side-nav-card__link--offline')) continue;
            const url = thumbnailUrl(login);
            if (thumbnailPreloadCache.has(url)) continue;
            const image = new Image();
            image.decoding = 'async';
            image.onload = () => {};
            image.onerror = () => {};
            image.src = url;
            thumbnailPreloadCache.set(url, image);
            count += 1;
            if (count >= 35) break;
        }
    }

    function removePreviewCard() {
        if (previewCard) previewCard.remove();
        previewCard = null;
        previewAnchor = null;
        previewData = null;
    }

    function positionPreview() {
        if (!previewCard || !previewAnchor || !previewAnchor.isConnected) return;
        const anchorRect = previewAnchor.getBoundingClientRect();
        const previewWidth = Math.min(Number(preferences.previewWidth) || 360, window.innerWidth - 16);
        const previewHeight = previewCard.getBoundingClientRect().height || 245;
        let left = anchorRect.right + 10;
        if (left + previewWidth > window.innerWidth - 8) left = Math.max(8, anchorRect.left - previewWidth - 10);
        left = Math.max(8, Math.min(left, window.innerWidth - previewWidth - 8));
        const top = Math.max(8, Math.min(
            anchorRect.top + anchorRect.height / 2 - previewHeight / 2,
            window.innerHeight - previewHeight - 8
        ));
        previewCard.style.left = Math.round(left) + 'px';
        previewCard.style.top = Math.round(top) + 'px';
    }

    function renderPreviewDetails() {
        if (!previewCard || !previewData) return;
        const name = previewCard.querySelector('.tts-preview-name');
        const viewers = previewCard.querySelector('.tts-preview-viewers');
        name.textContent = previewData.title || previewData.login;
        name.title = previewData.title || previewData.login;
        viewers.textContent = previewData.viewers || '—';
        viewers.style.display = '';
        positionPreview();
    }

    function showChannelPreview(hit) {
        if (!isTheater || !theaterModeDetected() || !preferences.previewEnabled || !hit) return;
        if (previewAnchor === hit.avatar && previewCard && previewCard.isConnected) {
            previewData = hit;
            renderPreviewDetails();
            return;
        }

        removePreviewCard();
        previewData = hit;
        previewAnchor = hit.avatar;

        const card = document.createElement('div');
        card.id = 'tts-channel-preview';
        card.setAttribute('role', 'tooltip');
        card.style.display = 'block';
        card.style.width = Math.min(Number(preferences.previewWidth) || 360, window.innerWidth - 16) + 'px';

        const header = document.createElement('div');
        header.className = 'tts-preview-head';

        const name = document.createElement('div');
        name.className = 'tts-preview-name';

        const viewers = document.createElement('div');
        viewers.className = 'tts-preview-viewers';

        const image = document.createElement('img');
        image.className = 'tts-preview-image';
        image.alt = 'Миниатюра трансляции ' + hit.title;
        image.loading = 'eager';
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        const avatarImage = hit.link.querySelector('img.tw-image-avatar, img');
        if (avatarImage && avatarImage.src) image.style.backgroundImage = 'url("' + avatarImage.src.replace(/["\\]/g, '') + '")';
        image.addEventListener('load', () => image.classList.add('tts-preview-image-loaded'));
        image.addEventListener('error', () => {
            if (image.dataset.fallbackTried !== '1') {
                image.dataset.fallbackTried = '1';
                image.src = thumbnailUrl(hit.login, '320x180');
            } else {
                image.classList.remove('tts-preview-image-loaded');
            }
        });
        image.src = thumbnailUrl(hit.login);

        header.append(name, viewers);
        card.append(header, image);
        document.body.appendChild(card);
        previewCard = card;
        applyPreferences();
        renderPreviewDetails();
        positionPreview();
        const cached = thumbnailPreloadCache.get(image.src);
        if (cached && cached.complete && cached.naturalWidth > 0) image.src = cached.src;
    }

    function hideChannelPreview() {
        removePreviewCard();
    }

    const CHAT_SETTINGS_BUTTON_SELECTOR = [
        '[data-a-target="chat-settings"]',
        '[data-a-target="chat-settings-button"]',
        '.chat-settings__show-button',
        'button[aria-label*="Chat Settings" i]',
        'button[aria-label*="Настройки чата" i]'
    ].join(',');

    function findChatSettingsMenu() {
        const knownSelectors = [
            '[data-a-target="chat-settings-menu"]',
            '[data-a-target="chat-settings-content"]',
            '[data-a-target="chat-settings-popover"]',
            '[data-a-target="chat-settings-panel"]',
            '[data-a-target="chat-settings-container"]',
            '.chat-settings__menu',
            '.chat-settings__content'
        ].join(',');

        const known = Array.from(document.querySelectorAll(knownSelectors))
            .filter(element => visibleElement(element) &&
                !element.closest('#tts-settings-panel') &&
                element.querySelectorAll('button,[role="menuitem"],[role="switch"],input').length >= 1);
        if (known.length) {
            known.sort((a, b) => {
                const ar = a.getBoundingClientRect();
                const br = b.getBoundingClientRect();
                return (ar.width * ar.height) - (br.width * br.height);
            });
            return known[0];
        }

        const keywords = [
            'pause chat', 'chat appearance', 'pop out chat', 'hide chat',
            'view chat rules', 'show timestamps', 'chat filters',
            'пауза чата', 'скрыть чат', 'внешний вид чата', 'правила чата',
            'фильтры чата', 'настройки чата', 'личность'
        ];
        const candidates = Array.from(document.querySelectorAll(
            '[role="menu"],[role="dialog"],[class*="chat-settings"],[class*="popover"],div'
        )).filter(element => {
            if (!visibleElement(element) || element.id === 'tts-settings-panel' ||
                element.closest('#tts-settings-panel') || element.id === 'tts-channel-preview') return false;
            const rect = element.getBoundingClientRect();
            if (rect.width < 180 || rect.width > 650 || rect.height < 100 || rect.height > 900) return false;
            const buttons = element.querySelectorAll('button,[role="menuitem"],[role="switch"],input').length;
            if (buttons < 2 || buttons > 80) return false;
            const text = readText(element).toLowerCase();
            if (text.length > 2400) return false;
            const matches = keywords.filter(keyword => text.includes(keyword)).length;
            return matches >= 2;
        });

        candidates.sort((a, b) => {
            const ar = a.getBoundingClientRect();
            const br = b.getBoundingClientRect();
            return (ar.width * ar.height) - (br.width * br.height);
        });
        return candidates[0] || null;
    }

    function makeSettingsSection(panel, titleText, helpText) {
        const section = document.createElement('section');
        section.className = 'tts-settings-section';
        const title = document.createElement('div');
        title.className = 'tts-settings-section-title';
        title.textContent = titleText;
        const help = document.createElement('div');
        help.className = 'tts-settings-section-help';
        help.textContent = helpText;
        section.append(title, help);
        panel.appendChild(section);
        return section;
    }

    function makeSettingsToggle(section, key, labelText, helpText) {
        const row = document.createElement('label');
        row.className = 'tts-settings-row';

        const textBox = document.createElement('span');
        textBox.className = 'tts-settings-row-copy';
        const label = document.createElement('span');
        label.className = 'tts-settings-label';
        label.textContent = labelText;
        const help = document.createElement('span');
        help.className = 'tts-settings-help';
        help.textContent = helpText;
        textBox.append(label, help);

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.preference = key;
        input.checked = !!preferences[key];
        input.addEventListener('change', () => {
            preferences[key] = input.checked;
            savePreferences();
            applyPreferences();
            if (key === 'previewEnabled' && !preferences.previewEnabled) hideChannelPreview();
            if (key === 'previewEnabled' && preferences.previewEnabled) preloadSidebarThumbnails();
            if (key === 'autoCollapseSidebar' && isTheater) {
                if (preferences.autoCollapseSidebar) ensureNativeSidebarCollapsed(findNav());
                else restoreNativeSidebarState();
            }
        });

        row.append(textBox, input);
        section.appendChild(row);
        return row;
    }

    function makeSettingsSelect(section, key, labelText, helpText, options) {
        const row = document.createElement('label');
        row.className = 'tts-settings-row';

        const textBox = document.createElement('span');
        textBox.className = 'tts-settings-row-copy';
        const label = document.createElement('span');
        label.className = 'tts-settings-label';
        label.textContent = labelText;
        const help = document.createElement('span');
        help.className = 'tts-settings-help';
        help.textContent = helpText;
        textBox.append(label, help);

        const select = document.createElement('select');
        select.className = 'tts-settings-control';
        select.dataset.preference = key;
        for (const optionData of options) {
            const option = document.createElement('option');
            option.value = String(optionData.value);
            option.textContent = optionData.label;
            select.appendChild(option);
        }
        select.value = String(preferences[key]);
        select.addEventListener('change', () => {
            const numeric = Number(select.value);
            preferences[key] = Number.isFinite(numeric) ? numeric : select.value;
            savePreferences();
            applyPreferences();
            if (key === 'previewWidth' || key === 'refreshInterval') {
                thumbnailPreloadCache.clear();
                preloadSidebarThumbnails();
                if (previewData && previewCard) {
                    const img = previewCard.querySelector('.tts-preview-image');
                    if (img) {
                        img.classList.remove('tts-preview-image-loaded');
                        img.dataset.fallbackTried = '';
                        img.style.backgroundImage = '';
                        img.src = thumbnailUrl(previewData.login);
                    }
                }
            }
        });
        row.append(textBox, select);
        section.appendChild(row);
        return row;
    }

    function ensureSettingsPanel() {
        if (settingsPanel && settingsBackdrop) return settingsPanel;

        const backdrop = document.createElement('div');
        backdrop.id = 'tts-settings-backdrop';
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) closeSettingsPanel();
        });

        const panel = document.createElement('section');
        panel.id = 'tts-settings-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', 'Настройки Theater Sidebar');

        const heading = document.createElement('div');
        heading.className = 'tts-settings-heading';
        const title = document.createElement('span');
        title.textContent = 'Настройки Theater Sidebar';
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'tts-settings-close';
        close.setAttribute('aria-label', 'Закрыть настройки');
        close.textContent = '×';
        close.addEventListener('click', closeSettingsPanel);
        heading.append(title, close);
        panel.appendChild(heading);

        const previewSection = makeSettingsSection(panel, 'Превью', 'Миниатюра показывается возле аватарки, только в театральном режиме.');
        makeSettingsToggle(previewSection, 'previewEnabled', 'Включить превью при наведении', 'Отключите, чтобы не показывать карточку и не загружать миниатюры.');
        makeSettingsSelect(previewSection, 'previewWidth', 'Размер карточки', 'Ширина окна превью.', [
            { value: 280, label: 'Маленький · 280 px' },
            { value: 360, label: 'Средний · 360 px' },
            { value: 440, label: 'Большой · 440 px' }
        ]);
        makeSettingsSelect(previewSection, 'refreshInterval', 'Обновление изображения', 'Интервал обновления кэшированного снимка.', [
            { value: 30, label: 'Каждые 30 секунд' },
            { value: 60, label: 'Каждую минуту' },
            { value: 120, label: 'Каждые 2 минуты' }
        ]);

        const sidebarSection = makeSettingsSection(panel, 'Список каналов', 'Не меняет аватарки, ссылки или кнопку сворачивания.');
        makeSettingsToggle(sidebarSection, 'hideDescriptions', 'Скрывать описания и подписи', 'Оставлять название канала и счётчик зрителей.');
        makeSettingsToggle(sidebarSection, 'hideCategories', 'Скрывать категории', 'Скрывать названия игр и категорий в панели каналов.');
        makeSettingsToggle(sidebarSection, 'autoCollapseSidebar', 'Сворачивать панель в театральном режиме', 'Восстанавливать исходное состояние при выходе из театрального режима.');

        const animationSection = makeSettingsSection(panel, 'Анимация', 'Настройте скорость выезда боковой панели.');
        makeSettingsSelect(animationSection, 'animationSpeed', 'Скорость анимации', 'Более короткая длительность делает движение быстрее.', [
            { value: 150, label: 'Быстро' },
            { value: 250, label: 'Обычная' },
            { value: 400, label: 'Плавно' }
        ]);

        const footnote = document.createElement('div');
        footnote.className = 'tts-settings-footnote';
        footnote.textContent = 'Настройки сохраняются в браузере и применяются сразу.';
        panel.appendChild(footnote);

        panel.addEventListener('click', event => event.stopPropagation());
        backdrop.appendChild(panel);
        document.body.appendChild(backdrop);
        settingsBackdrop = backdrop;
        settingsPanel = panel;
        return panel;
    }

    function placeSettingsPanel() {
        // The dialog is centered by the backdrop's flex layout.
    }

    function openSettingsPanel(anchor) {
        settingsMenuAnchor = anchor;
        const panel = ensureSettingsPanel();
        settingsPanelOpen = true;
        settingsBackdrop.style.display = 'flex';
        panel.style.display = 'block';
        panel.querySelectorAll('[data-preference]').forEach(control => {
            control.value = String(preferences[control.dataset.preference]);
        });
        const item = settingsMenuItem;
        if (item) item.setAttribute('aria-expanded', 'true');
    }

    function closeSettingsPanel() {
        settingsPanelOpen = false;
        if (settingsBackdrop) settingsBackdrop.style.display = 'none';
        if (settingsPanel) settingsPanel.style.display = 'none';
        if (settingsMenuItem) settingsMenuItem.setAttribute('aria-expanded', 'false');
    }

    function toggleSettingsPanel(anchor) {
        if (settingsPanelOpen) {
            closeSettingsPanel();
        } else {
            openSettingsPanel(anchor);
        }
    }

    function addSettingsMenuItem(menu) {
        if (!menu) return;

        const existingItems = Array.from(document.querySelectorAll('#tts-settings-menu-item'));
        const existingInMenu = existingItems.find(item => menu.contains(item));
        if (existingInMenu) {
            settingsMenuItem = existingInMenu;
            existingItems.filter(item => item !== existingInMenu).forEach(item => item.remove());
            document.querySelectorAll('#tts-settings-menu-separator').forEach(element => element.remove());
            return;
        }
        // Twitch can render nested chat-settings wrappers. Keep exactly one entry.
        existingItems.forEach(item => item.remove());
        document.querySelectorAll('#tts-settings-menu-separator').forEach(element => element.remove());

        const template = menu.querySelector('button,[role="menuitem"]');
        const item = template ? template.cloneNode(false) : document.createElement('button');
        item.id = 'tts-settings-menu-item';
        item.removeAttribute('href');
        item.removeAttribute('disabled');
        item.removeAttribute('data-a-target');
        item.removeAttribute('aria-label');
        item.removeAttribute('title');
        item.removeAttribute('tabindex');
        item.textContent = 'Настройки Theater Sidebar';
        if (item.tagName === 'BUTTON') item.type = 'button';
        item.setAttribute('role', 'menuitem');
        item.setAttribute('aria-haspopup', 'dialog');
        item.setAttribute('aria-expanded', 'false');
        item.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            toggleSettingsPanel(item);
        });

        menu.appendChild(item);
        settingsMenuItem = item;
    }

    function ensureChatSettingsMenuItem() {
        if (!chatSettingsClickAt || Date.now() - chatSettingsClickAt > 2600) return;
        const existing = document.getElementById('tts-settings-menu-item');
        if (existing && visibleElement(existing)) {
            settingsMenuItem = existing;
            document.querySelectorAll('#tts-settings-menu-item').forEach(item => {
                if (item !== existing) item.remove();
            });
            return;
        }
        if (existing) existing.remove();
        const menu = findChatSettingsMenu();
        if (menu) addSettingsMenuItem(menu);
    }

    document.addEventListener('click', event => {
        const gear = event.target instanceof Element
            ? event.target.closest(CHAT_SETTINGS_BUTTON_SELECTOR)
            : null;
        if (gear) {
            chatSettingsClickAt = Date.now();
            [0, 60, 140, 280, 480].forEach(delay => {
                window.setTimeout(ensureChatSettingsMenuItem, delay);
            });
        }

        if (settingsPanelOpen && settingsPanel &&
            !settingsPanel.contains(event.target) &&
            !(settingsMenuItem && settingsMenuItem.contains(event.target))) {
            closeSettingsPanel();
        }
    }, true);

    document.addEventListener('pointerover', event => {
        if (!preferences.previewEnabled) return;
        if (!isTheater && theaterModeDetected()) syncState();
        if (!isTheater || !theaterModeDetected()) return;
        const hit = getChannelHoverHit(event.target);
        if (!hit) return;
        if (event.relatedTarget instanceof Node && hit.avatar.contains(event.relatedTarget)) return;
        showChannelPreview(hit);
    }, true);

    document.addEventListener('pointerout', event => {
        if (!previewAnchor) return;
        if (event.relatedTarget instanceof Node && previewAnchor.contains(event.relatedTarget)) return;
        const nextHit = getChannelHoverHit(event.relatedTarget);
        if (nextHit && nextHit.avatar === previewAnchor) return;
        // Deliberately immediate: the preview exists only while the avatar is hovered.
        hideChannelPreview();
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && settingsPanelOpen) {
            closeSettingsPanel();
            // Let Twitch handle Escape too, so its native chat menu can close normally.
        }
    }, true);

    window.addEventListener('resize', () => {
        positionPreview();
        placeSettingsPanel();
    }, { passive: true });
    window.addEventListener('scroll', () => {
        positionPreview();
        placeSettingsPanel();
    }, { passive: true, capture: true });

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
            activeHost.classList.remove(OPEN_CLASS, HOST_CLASS, INSTANT_CLASS);
            restoreHostProperties(activeHost);
        }
        activeHost = null;
        activeNav = null;
        isOpen = false;
    }

    function deactivateTheater() {
        clearTimers();
        hideChannelPreview();
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
        // Apply the hidden position without animating from Twitch's visible layout.
        host.classList.add(HOST_CLASS, INSTANT_CLASS);
        document.documentElement.classList.add(ROOT_CLASS);
        syncHostWidth();

        // Two frames ensure the hidden, transition-free state is painted once
        // before transitions are re-enabled for subsequent hover animations.
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (host.isConnected) host.classList.remove(INSTANT_CLASS);
            });
        });

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

        if (preferences.autoCollapseSidebar) ensureNativeSidebarCollapsed(nav);
        preloadSidebarThumbnails();

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

        // Prepare the sidebar during the capture phase of the entry click. Both
        // positioning it off-screen and collapsing it happen before the browser's
        // next paint, so the expanded panel is never shown during the theater switch.
        if (!theaterModeDetected()) {
            const nav = findNav();
            const host = findHost(nav);
            if (nav && host) {
                activateHost(nav, host);
                ensureNativeSidebarCollapsed(nav);
            }
        }

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
        ensureChatSettingsMenuItem();
    }, CONFIG.statePollMs);

    window.addEventListener('pagehide', () => {
        clearTimers();
        if (syncTimer !== null) clearInterval(syncTimer);
        document.documentElement.classList.remove(ROOT_CLASS);
        hideChannelPreview();
        closeSettingsPanel();
        releaseHost();
    }, { once: true });
})();
