// ==UserScript==
// @name         Twitch Theater Sidebar on Hover
// @namespace    https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @homepageURL  https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @supportURL   https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/issues
// @version      5.4.0
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
        // The host is moved from Twitch's normal layout into a fixed off-screen
        // position on activation. Disable transitions for that first layout change,
        // otherwise the expanded sidebar animates across the screen and flashes.
        'html.' + ROOT_CLASS + ' .' + HOST_CLASS + '.' + INSTANT_CLASS + '{transition:none!important;}' +
        'html.' + ROOT_CLASS + ' .' + HOST_CLASS + '.' + OPEN_CLASS + ' {' +
            'transform:translate3d(0,0,0)!important;pointer-events:auto!important;' +
            'box-shadow:5px 0 24px rgba(0,0,0,.38)!important;' +
        '}' +
        '@media(prefers-reduced-motion:reduce){html.' + ROOT_CLASS + ' .' + HOST_CLASS + '{transition:none!important;}}';
    (document.head || document.documentElement).appendChild(style);

    style.textContent +=
        '#tts-channel-preview{' +
            'position:fixed;display:none;width:320px;max-width:calc(100vw - 16px);' +
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
        '#tts-channel-preview .tts-preview-category{' +
            'display:none;padding:0 11px 8px;color:#adadb8;font-size:11px;' +
            'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
        '}' +
        '#tts-channel-preview .tts-preview-video{' +
            'display:block;width:100%;aspect-ratio:16/9;border:0;background:#000;' +
        '}' +
        '#tts-settings-panel{' +
            'position:fixed;z-index:2147483647;width:300px;max-width:calc(100vw - 20px);' +
            'box-sizing:border-box;padding:14px;background:#18181b;color:#efeff1;' +
            'border:1px solid rgba(255,255,255,.13);border-radius:10px;' +
            'box-shadow:0 12px 38px rgba(0,0,0,.55);font:13px/1.4 Inter,Roobert,Helvetica Neue,Helvetica,Arial,sans-serif;' +
        '}' +
        '#tts-settings-panel .tts-settings-heading{' +
            'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
            'font-size:14px;font-weight:700;margin-bottom:11px;' +
        '}' +
        '#tts-settings-panel .tts-settings-close{' +
            'border:0;background:transparent;color:#adadb8;font-size:19px;line-height:1;' +
            'cursor:pointer;padding:0 2px;' +
        '}' +
        '#tts-settings-panel .tts-settings-row{' +
            'display:flex;align-items:flex-start;gap:10px;padding:9px 0;cursor:pointer;' +
        '}' +
        '#tts-settings-panel .tts-settings-row + .tts-settings-row{' +
            'border-top:1px solid rgba(255,255,255,.09);' +
        '}' +
        '#tts-settings-panel .tts-settings-row input{' +
            'margin:2px 0 0;accent-color:#9147ff;flex-shrink:0;' +
        '}' +
        '#tts-settings-panel .tts-settings-label{display:block;font-weight:600;}' +
        '#tts-settings-panel .tts-settings-help{display:block;color:#adadb8;font-size:11px;margin-top:2px;}' +
        '#tts-settings-menu-item{' +
            'display:flex;align-items:center;width:100%;box-sizing:border-box;text-align:left;' +
            'padding:10px 16px;border:0;border-radius:0;background:transparent;color:inherit;' +
            'font:inherit;cursor:pointer;white-space:nowrap;' +
        '}' +
        '#tts-settings-menu-item:hover{background:rgba(255,255,255,.08);}' +
        '#tts-settings-menu-separator{height:1px;margin:6px 0;background:rgba(255,255,255,.12);}' ;

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
        compactPreview: true
    });
    let preferences = loadPreferences();
    let previewCard = null;
    let previewAnchor = null;
    let previewData = null;
    let settingsPanel = null;
    let settingsMenuItem = null;
    let settingsMenuAnchor = null;
    let chatSettingsClickAt = 0;
    let settingsPanelOpen = false;

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


    function loadPreferences() {
        try {
            const saved = JSON.parse(localStorage.getItem('tts-theater-sidebar-preferences-v1') || '{}');
            return {
                previewEnabled: typeof saved.previewEnabled === 'boolean'
                    ? saved.previewEnabled : true,
                compactPreview: typeof saved.compactPreview === 'boolean'
                    ? saved.compactPreview : true
            };
        } catch (_) {
            return { previewEnabled: true, compactPreview: true };
        }
    }

    function savePreferences() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
        } catch (_) {
            // Keep the current session usable if browser storage is unavailable.
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
        if (!link.matches('.side-nav-card__link, [data-a-target="side-nav-card"], a[href]')) return null;

        let login = '';
        try {
            const path = new URL(link.getAttribute('href'), location.origin).pathname;
            const match = path.match(/^\/([a-zA-Z0-9_]+)\/?$/);
            if (match) login = match[1];
        } catch (_) {
            return null;
        }

        const reservedRoutes = new Set([
            'directory', 'downloads', 'settings', 'subscriptions', 'wallet',
            'inventory', 'videos', 'clip', 'search', 'jobs', 'p', 'turbo'
        ]);
        if (!login || reservedRoutes.has(login.toLowerCase())) return null;

        const card = link.closest('.side-nav-card, [data-a-target="side-nav-card"]') || link;
        const viewerSources = [
            '[data-a-target="side-nav-card-viewers"]',
            '.side-nav-card__viewers',
            '.side-nav-card__live-status span[aria-hidden="true"]',
            '.side-nav-card__live-status'
        ];
        let viewers = '';
        for (const selector of viewerSources) {
            const candidate = card.querySelector(selector);
            const candidateText = readText(candidate);
            const match = candidateText.match(/\b\d[\d.,]*\s*[KMB]?\b/i);
            if (match) {
                viewers = match[0].replace(/\s+/g, '');
                break;
            }
        }

        const titleElement = card.querySelector('.side-nav-card__title');
        const image = link.querySelector('img.tw-image-avatar, img');
        const title = readText(titleElement) ||
            (image && image.getAttribute('alt')) ||
            link.getAttribute('aria-label') ||
            login;
        const category = readText(card.querySelector('.side-nav-card__metadata, [data-a-target="side-nav-card-metadata"]'));

        // Offline followed channels have no viewer count and cannot provide a live video.
        const avatarIsOffline = !!avatar.closest('.side-nav-card__avatar--offline') ||
            link.classList.contains('side-nav-card__link--offline');
        if (!viewers && avatarIsOffline) return null;

        return { avatar, link, card, login, title, viewers, category };
    }

    function removePreviewCard() {
        if (previewCard) {
            const iframe = previewCard.querySelector('iframe');
            if (iframe) iframe.src = 'about:blank';
            previewCard.remove();
        }
        previewCard = null;
        previewAnchor = null;
        previewData = null;
    }

    function positionPreview() {
        if (!previewCard || !previewAnchor || !previewAnchor.isConnected) return;
        const anchorRect = previewAnchor.getBoundingClientRect();
        const previewWidth = Math.min(320, window.innerWidth - 16);
        const previewHeight = previewCard.getBoundingClientRect().height || 225;
        let left = anchorRect.right + 10;
        if (left + previewWidth > window.innerWidth - 8) {
            left = Math.max(8, anchorRect.left - previewWidth - 10);
        }
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
        const category = previewCard.querySelector('.tts-preview-category');
        name.textContent = previewData.title;
        name.title = previewData.title;
        viewers.textContent = previewData.viewers ? previewData.viewers : '';
        viewers.style.display = previewData.viewers ? '' : 'none';
        category.textContent = previewData.category;
        category.style.display = !preferences.compactPreview && previewData.category ? 'block' : 'none';
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

        const header = document.createElement('div');
        header.className = 'tts-preview-head';

        const name = document.createElement('div');
        name.className = 'tts-preview-name';

        const viewers = document.createElement('div');
        viewers.className = 'tts-preview-viewers';

        const category = document.createElement('div');
        category.className = 'tts-preview-category';

        const frame = document.createElement('iframe');
        frame.className = 'tts-preview-video';
        frame.title = 'Предпросмотр канала ' + hit.title;
        frame.allow = 'autoplay; encrypted-media; picture-in-picture';
        frame.referrerPolicy = 'origin';
        frame.loading = 'eager';
        frame.setAttribute('playsinline', '');
        frame.src = 'https://player.twitch.tv/?channel=' +
            encodeURIComponent(hit.login) +
            '&parent=www.twitch.tv&muted=true&autoplay=true&controls=false&quality=160p30';

        header.append(name, viewers);
        card.append(header, category, frame);
        document.body.appendChild(card);
        previewCard = card;
        renderPreviewDetails();
        previewCard.style.display = 'block';
        positionPreview();
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
                !element.querySelector('#tts-settings-menu-item') &&
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
            if (element.querySelector('#tts-settings-menu-item')) return false;
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

    function makeSettingsToggle(key, labelText, helpText) {
        const row = document.createElement('label');
        row.className = 'tts-settings-row';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!preferences[key];
        input.addEventListener('change', () => {
            preferences[key] = input.checked;
            savePreferences();
            if (key === 'previewEnabled' && !preferences.previewEnabled) hideChannelPreview();
            if (key === 'compactPreview') renderPreviewDetails();
        });

        const textBox = document.createElement('span');
        const label = document.createElement('span');
        label.className = 'tts-settings-label';
        label.textContent = labelText;
        const help = document.createElement('span');
        help.className = 'tts-settings-help';
        help.textContent = helpText;
        textBox.append(label, help);
        row.append(input, textBox);
        return row;
    }

    function placeSettingsPanel() {
        if (!settingsPanel || !settingsPanelOpen) return;
        const anchor = settingsMenuItem && settingsMenuItem.isConnected
            ? settingsMenuItem
            : settingsMenuAnchor;
        if (!anchor || !anchor.isConnected) return;
        const rect = anchor.getBoundingClientRect();
        const panelRect = settingsPanel.getBoundingClientRect();
        const width = panelRect.width || 300;
        const height = panelRect.height || 145;
        let left = rect.left;
        if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
        left = Math.max(8, left);
        let top = rect.bottom + 8;
        if (top + height > window.innerHeight - 8) top = rect.top - height - 8;
        top = Math.max(8, Math.min(top, window.innerHeight - height - 8));
        settingsPanel.style.left = Math.round(left) + 'px';
        settingsPanel.style.top = Math.round(top) + 'px';
    }

    function ensureSettingsPanel() {
        if (settingsPanel) return settingsPanel;

        const panel = document.createElement('section');
        panel.id = 'tts-settings-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Настройки Theater Sidebar');

        const heading = document.createElement('div');
        heading.className = 'tts-settings-heading';
        const title = document.createElement('span');
        title.textContent = 'Theater Sidebar';
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'tts-settings-close';
        close.setAttribute('aria-label', 'Закрыть настройки');
        close.textContent = '×';
        close.addEventListener('click', () => closeSettingsPanel());
        heading.append(title, close);

        panel.append(
            heading,
            makeSettingsToggle(
                'previewEnabled',
                'Превью при наведении',
                'Показывать небольшое окно трансляции у аватарки.'
            ),
            makeSettingsToggle(
                'compactPreview',
                'Только название и зрители',
                'Скрывать категорию и остальные подписи в превью.'
            )
        );

        panel.addEventListener('click', event => event.stopPropagation());
        document.body.appendChild(panel);
        panel.style.display = 'none';
        settingsPanel = panel;
        return panel;
    }

    function openSettingsPanel(anchor) {
        settingsMenuAnchor = anchor;
        const panel = ensureSettingsPanel();
        settingsPanelOpen = true;
        panel.style.display = 'block';
        const inputs = panel.querySelectorAll('input[type="checkbox"]');
        if (inputs[0]) inputs[0].checked = !!preferences.previewEnabled;
        if (inputs[1]) inputs[1].checked = !!preferences.compactPreview;
        placeSettingsPanel();
        const item = settingsMenuItem;
        if (item) item.setAttribute('aria-expanded', 'true');
    }

    function closeSettingsPanel() {
        settingsPanelOpen = false;
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
        if (!menu || menu.querySelector('#tts-settings-menu-item')) return;
        const separator = document.createElement('div');
        separator.id = 'tts-settings-menu-separator';
        separator.setAttribute('aria-hidden', 'true');

        const item = document.createElement('button');
        item.id = 'tts-settings-menu-item';
        item.type = 'button';
        item.setAttribute('role', 'menuitem');
        item.setAttribute('aria-haspopup', 'dialog');
        item.setAttribute('aria-expanded', 'false');
        item.textContent = 'Настройки Theater Sidebar';
        item.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            toggleSettingsPanel(item);
        });

        menu.append(separator, item);
        settingsMenuItem = item;
    }

    function ensureChatSettingsMenuItem() {
        if (!chatSettingsClickAt || Date.now() - chatSettingsClickAt > 2600) return;
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
            event.stopPropagation();
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
