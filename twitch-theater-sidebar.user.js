// ==UserScript==
// @name         Twitch Theater Sidebar — Diagnostic Modes
// @namespace    https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @homepageURL  https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar
// @supportURL   https://github.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/issues
// @version      4.3.0
// @description  Clean up legacy sidebar scripts and audit CSS affecting Twitch navigation.
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

    const ID = 'tts4';
    const EDGE_WIDTH = 32;
    const SHOW_DELAY = 70;
    const HIDE_DELAY = 260;
    const PANEL_WIDTH = 280;
    const LEGACY_SEEN = new Set();

    // Earlier revisions used different names and CSS class names. Tampermonkey may
    // keep them installed as separate scripts after @name changed. Remove their
    // styles/classes periodically so they cannot override this diagnostic version.
    function cleanupLegacySidebarScripts() {
        const legacyIds = [
            'twitch-theater-sidebar-style',
            'tts30-style',
            'twitch-theater-sidebar-panel',
            'twitch-theater-sidebar-trigger',
            'tms-overlay',
            'tms-trigger'
        ];

        for (const id of legacyIds) {
            const node = document.getElementById(id);
            if (node) {
                LEGACY_SEEN.add('legacy element #' + id);
                node.remove();
            }
        }

        for (const node of Array.from(document.querySelectorAll('style'))) {
            if (node.id === ID + '-style') continue;
            const text = node.textContent || '';
            if (
                text.includes('#tms-overlay') ||
                text.includes('#tms-trigger') ||
                text.includes('#twitch-theater-sidebar-panel') ||
                text.includes('#twitch-theater-sidebar-trigger') ||
                text.includes('.tts-native-sidebar') ||
                text.includes('.tts30-native-nav')
            ) {
                LEGACY_SEEN.add('legacy style ' + (node.id ? '#' + node.id : '(no id)'));
                node.remove();
            }
        }

        document.documentElement.classList.remove('tts-theater-mode-active', 'tts30-layout');
        for (const node of document.querySelectorAll(
            '.tts-native-sidebar, .tts-native-sidebar-open, .tts30-native-nav, .tts30-open'
        )) {
            LEGACY_SEEN.add('legacy class on ' + node.tagName.toLowerCase() + (node.id ? '#' + node.id : ''));
            node.classList.remove(
                'tts-native-sidebar',
                'tts-native-sidebar-open',
                'tts30-native-nav',
                'tts30-open'
            );
        }
    }

    cleanupLegacySidebarScripts();

    document.getElementById(ID + '-toolbar')?.remove();
    document.getElementById(ID + '-style')?.remove();
    document.getElementById('twitch-theater-sidebar-panel')?.remove();
    document.getElementById('twitch-theater-sidebar-trigger')?.remove();
    document.getElementById('twitch-theater-sidebar-style')?.remove();
    document.getElementById('tts30-style')?.remove();

    const style = document.createElement('style');
    style.id = ID + '-style';
    style.textContent =
        '.tts4-force{' +
            'position:fixed!important;top:0!important;left:0!important;right:auto!important;bottom:0!important;' +
            'width:min(280px,88vw)!important;min-width:min(280px,88vw)!important;max-width:88vw!important;' +
            'height:100vh!important;height:100dvh!important;min-height:0!important;max-height:100vh!important;max-height:100dvh!important;' +
            'margin:0!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;' +
            'overflow-x:hidden!important;overflow-y:auto!important;visibility:visible!important;opacity:1!important;' +
            'transform:none!important;translate:none!important;z-index:2147483000!important;' +
            'background:var(--color-background-base,#0e0e10)!important;color:var(--color-text-base,#efeff1)!important;' +
            'pointer-events:auto!important;box-shadow:5px 0 24px rgba(0,0,0,.45)!important;' +
            'border-right:1px solid rgba(255,255,255,.12)!important;' +
        '}' +
        '.tts4-force-parent{' +
            'position:fixed!important;top:0!important;left:0!important;right:auto!important;bottom:0!important;' +
            'width:min(280px,88vw)!important;min-width:min(280px,88vw)!important;max-width:88vw!important;' +
            'height:100vh!important;height:100dvh!important;margin:0!important;overflow:visible!important;' +
            'visibility:visible!important;opacity:1!important;transform:none!important;translate:none!important;' +
            'z-index:2147483000!important;pointer-events:auto!important;' +
            'background:var(--color-background-base,#0e0e10)!important;box-shadow:5px 0 24px rgba(0,0,0,.45)!important;' +
        '}' +
        '.tts4-outline{outline:3px solid #ffb000!important;outline-offset:-3px!important;background-color:rgba(255,176,0,.07)!important;}' +
        '#tts4-toolbar,#tts4-toolbar *{box-sizing:border-box;}' +
        '#tts4-toolbar{' +
            'position:fixed;top:10px;right:10px;width:min(470px,calc(100vw - 20px));max-height:min(86vh,740px);overflow:auto;' +
            'z-index:2147483647;padding:10px;border:1px solid rgba(255,255,255,.22);border-radius:8px;' +
            'color:#f4f4f5;background:rgba(20,20,23,.97);box-shadow:0 6px 28px rgba(0,0,0,.6);' +
            'font:12px/1.4 Arial,sans-serif;' +
        '}' +
        '#tts4-toolbar .tts4-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}' +
        '#tts4-toolbar .tts4-title{margin:0;color:#fff;font-size:13px;font-weight:700;}' +
        '#tts4-toolbar .tts4-status{padding:8px;margin-bottom:8px;border-radius:5px;background:rgba(255,255,255,.08);white-space:pre-wrap;overflow-wrap:anywhere;}' +
        '#tts4-toolbar .tts4-report{display:block;width:100%;height:180px;margin:6px 0;padding:8px;border:1px solid #555;border-radius:5px;background:#111;color:#e8e8eb;font:10px/1.35 Consolas,monospace;white-space:pre;resize:vertical;}' +
        '#tts4-toolbar .tts4-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-bottom:8px;}' +
        '#tts4-toolbar button{min-width:0;padding:7px 6px;border:1px solid rgba(255,255,255,.2);border-radius:5px;color:#f4f4f5;background:#303036;font:inherit;cursor:pointer;text-align:left;}' +
        '#tts4-toolbar button:hover{background:#44444c;}' +
        '#tts4-toolbar button.tts4-selected{border-color:#bf94ff;background:#59359a;color:white;}' +
        '#tts4-toolbar button.tts4-action{text-align:center;}' +
        '#tts4-toolbar .tts4-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-bottom:6px;}' +
        '#tts4-toolbar .tts4-help{color:#c8c8d0;font-size:11px;}' +
        '#tts4-toolbar .tts4-report{display:block;width:100%;height:180px;margin:6px 0;padding:8px;border:1px solid #555;border-radius:5px;background:#111;color:#e8e8eb;font:10px/1.35 Consolas,monospace;white-space:pre;resize:vertical;}' +
        '#tts4-toolbar.tts4-minimized .tts4-body{display:none;}';
    (document.head || document.documentElement).appendChild(style);

    const toolbar = document.createElement('section');
    toolbar.id = ID + '-toolbar';
    toolbar.innerHTML = [
        '<div class="tts4-head">',
        '<div class="tts4-title">Twitch Sidebar — тест режимов</div>',
        '<button type="button" id="tts4-minimize" title="Свернуть/развернуть">—</button>',
        '</div>',
        '<div class="tts4-body">',
        '<div class="tts4-status" id="tts4-status">Запуск диагностики…</div>',
        '<textarea class="tts4-report" id="tts4-report" readonly spellcheck="false" placeholder="Нажми 10. CSS-аудит, затем скопируй отчёт отсюда."></textarea>',
        '<div class="tts4-grid" id="tts4-modes">',
        '<button type="button" data-mode="1">1. #side-nav</button>',
        '<button type="button" data-mode="2">2. aria-label</button>',
        '<button type="button" data-mode="3">3. .side-nav</button>',
        '<button type="button" data-mode="4">4. data-test</button>',
        '<button type="button" data-mode="5">5. data-a-target</button>',
        '<button type="button" data-mode="6">6. Родитель</button>',
        '<button type="button" data-mode="7">7. Жёсткий стиль</button>',
        '<button type="button" data-mode="8">8. Кнопка Twitch</button>',
        '<button type="button" data-mode="9">9. Подсветка DOM</button>',
        '<button type="button" data-mode="10">10. Кто скрывает?</button>',
        '<button type="button" data-mode="11">11. Внешний контейнер</button>',
        '</div>',
        '<div class="tts4-actions">',
        '<button type="button" class="tts4-action" id="tts4-show">Показать сейчас</button>',
        '<button type="button" class="tts4-action" id="tts4-hide">Скрыть / тест края</button>',
        '<button type="button" class="tts4-action" id="tts4-reset">Сброс</button>',
        '</div>',
        '<div class="tts4-help">Режимы 1–9 тестируют способы показа; 10 ищет скрывающий CSS. Режим 11 поднимает внешний контейнер настоящей панели поверх плеера. Для наведения нажми «Скрыть / тест края», затем подведи мышь к левому краю.</div>',
        '</div>'
    ].join('');
    document.body.appendChild(toolbar);

    const statusEl = toolbar.querySelector('#tts4-status');
    const reportEl = toolbar.querySelector('#tts4-report');
    const modeButtons = Array.from(toolbar.querySelectorAll('[data-mode]'));

    const SELECTORS = {
        1: '#side-nav',
        2: '[aria-label="Left Navigation"], [aria-label*="Left Navigation" i]',
        3: '.side-nav',
        4: '[data-test-selector="side-nav"]',
        5: '[data-a-target="side-nav-bar"], nav[data-a-target="side-nav-bar"]'
    };
    const ALL_SELECTORS = [
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
        '.channel-root--theatre',
        '.channel-root--theater',
        '[class*="channel-root"][class*="theatre"]',
        '[class*="channel-root"][class*="theater"]'
    ];

    let selectedMode = 11;
    let activeTarget = null;
    let previewOpen = false;
    let openedByHover = false;
    let nativeToggleClickedByUs = false;
    let nativeToggleButton = null;
    let showTimer = null;
    let hideTimer = null;
    let outlined = [];
    let inlineOriginals = new Map();
    let statusMessage = '';

    function queryOne(selector) {
        try { return document.querySelector(selector); } catch (_) { return null; }
    }
    function queryAll(selector) {
        try { return Array.from(document.querySelectorAll(selector)); } catch (_) { return []; }
    }
    function allCandidates() {
        const list = [];
        const seen = new Set();
        for (const selector of ALL_SELECTORS) {
            for (const el of queryAll(selector)) {
                if (!seen.has(el) && el !== toolbar && !toolbar.contains(el)) {
                    seen.add(el);
                    list.push({ el, selector });
                }
            }
        }
        return list;
    }
    function scoreNode(el) {
        const links = el.querySelectorAll('a[href]').length;
        const cards = el.querySelectorAll('.side-nav-card,.side-nav-card__title,[data-a-target*="side-nav-card"]').length;
        const cls = typeof el.className === 'string' ? el.className : '';
        const aria = (el.getAttribute('aria-label') || '').toLowerCase();
        return links + cards * 4 + (el.id === 'side-nav' ? 80 : 0) +
            (/side-nav/i.test(cls) ? 25 : 0) + (aria.includes('left navigation') ? 30 : 0);
    }
    function bestCandidate() {
        const candidates = allCandidates();
        candidates.sort((a, b) => scoreNode(b.el) - scoreNode(a.el));
        return candidates[0] || null;
    }
    function describe(el) {
        if (!el) return 'не найден';
        const tag = el.tagName ? el.tagName.toLowerCase() : '?';
        const id = el.id ? '#' + el.id : '';
        let cls = '';
        if (typeof el.className === 'string') cls = el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).map(x => '.' + x).join('');
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const links = el.querySelectorAll('a[href]').length;
        return tag + id + cls + ' | links=' + links +
            ' | rect=' + Math.round(rect.left) + ',' + Math.round(rect.top) + ' ' +
            Math.round(rect.width) + '×' + Math.round(rect.height) +
            ' | display=' + cs.display + ' / visibility=' + cs.visibility;
    }
    function theaterDetected() {
        for (const selector of THEATER_SELECTORS) {
            if (queryOne(selector)) return selector;
        }
        return '';
    }
    function streamRoute() {
        const parts = location.pathname.split('/').filter(Boolean);
        const reserved = new Set([
            'directory','downloads','inventory','settings','wallet','subscriptions',
            'turbo','videos','search','jobs','p','moderator','popout','embed','login','signup'
        ]);
        return parts.length === 1 && !reserved.has(parts[0].toLowerCase());
    }
    function hasPlayer() {
        return !!queryOne('video,.video-player,[data-a-target="video-player"],[data-a-target="player-overlay-click-handler"],#channel-player');
    }
    function captureInline(el, prop) {
        let props = inlineOriginals.get(el);
        if (!props) {
            props = new Map();
            inlineOriginals.set(el, props);
        }
        if (!props.has(prop)) props.set(prop, {
            value: el.style.getPropertyValue(prop),
            priority: el.style.getPropertyPriority(prop)
        });
    }
    function setImportant(el, prop, value) {
        captureInline(el, prop);
        el.style.setProperty(prop, value, 'important');
    }
    function forceInline(el) {
        const values = {
            position:'fixed', top:'0px', left:'0px', right:'auto', bottom:'0px',
            width:'min(280px, 88vw)', 'min-width':'min(280px, 88vw)', 'max-width':'88vw',
            height:'100vh', 'max-height':'100vh', margin:'0px', display:'flex',
            'flex-direction':'column', 'box-sizing':'border-box', 'overflow-x':'hidden',
            'overflow-y':'auto', visibility:'visible', opacity:'1', transform:'none',
            translate:'none', 'z-index':'2147483000', 'pointer-events':'auto',
            background:'var(--color-background-base, #0e0e10)',
            'box-shadow':'5px 0 24px rgba(0,0,0,.45)'
        };
        for (const [prop, value] of Object.entries(values)) setImportant(el, prop, value);
    }
    function restoreInline() {
        for (const [el, props] of inlineOriginals.entries()) {
            for (const [prop, saved] of props.entries()) {
                if (saved.value) el.style.setProperty(prop, saved.value, saved.priority);
                else el.style.removeProperty(prop);
            }
        }
        inlineOriginals.clear();
    }
    function currentToggleButton() {
        return queryOne(
            'button[data-a-target="side-nav-arrow"],' +
            'button[aria-label*="Expand Side Nav" i],' +
            'button[aria-label*="Collapse Side Nav" i],' +
            'button[aria-label*="Expand sidebar" i],' +
            'button[aria-label*="Collapse sidebar" i]'
        );
    }
    function restoreNativeToggle() {
        if (!nativeToggleClickedByUs) return;
        const button = currentToggleButton() || nativeToggleButton;
        if (button && button.isConnected) {
            const label = ((button.getAttribute('aria-label') || '') + ' ' + (button.getAttribute('title') || '')).toLowerCase();
            const expanded = button.getAttribute('aria-expanded');
            if (expanded === 'true' || /collapse/.test(label)) button.click();
        }
        nativeToggleClickedByUs = false;
        nativeToggleButton = null;
    }
    function removeAppliedStyles() {
        if (activeTarget) activeTarget.classList.remove('tts4-force', 'tts4-force-parent', 'tts4-outline');
        for (const el of outlined) el.classList.remove('tts4-outline');
        outlined = [];
        restoreInline();
        restoreNativeToggle();
        activeTarget = null;
        previewOpen = false;
        openedByHover = false;
    }
    function clearTimers() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        showTimer = null;
        hideTimer = null;
    }
    function renderStatus() {
        const candidates = allCandidates();
        const theater = theaterDetected();
        const best = bestCandidate();
        const theaterText = theater ? 'да (' + theater + ')' : 'селектор не найден';
        statusEl.textContent = statusMessage + '\n' +
            'Театр: ' + theaterText +
            ' | URL канала: ' + (streamRoute() ? 'да' : 'нет') +
            ' | Плеер: ' + (hasPlayer() ? 'да' : 'нет') + '\n' +
            'Совпадений навигации: ' + candidates.length +
            ' | Лучший кандидат: ' + (best ? describe(best.el) : 'не найден');
        modeButtons.forEach(btn => btn.classList.toggle('tts4-selected', Number(btn.dataset.mode) === selectedMode));
    }
    function setStatus(message) {
        statusMessage = message;
        renderStatus();
    }

    function getSuspiciousDeclarations(styleDecl) {
        const suspicious = [];
        const get = prop => (styleDecl.getPropertyValue(prop) || '').trim().toLowerCase();
        const display = get('display');
        const visibility = get('visibility');
        const opacity = get('opacity');
        const transform = get('transform');
        const translate = get('translate');
        const clipPath = get('clip-path');
        const clip = get('clip');
        const width = get('width');
        const height = get('height');
        const maxWidth = get('max-width');
        const maxHeight = get('max-height');
        const left = get('left');
        const contentVisibility = get('content-visibility');

        if (display === 'none') suspicious.push('display:none');
        if (visibility === 'hidden' || visibility === 'collapse') suspicious.push('visibility:' + visibility);
        if (opacity !== '' && Number(opacity) <= 0.03) suspicious.push('opacity:' + opacity);
        if (contentVisibility === 'hidden') suspicious.push('content-visibility:hidden');
        if (clipPath.includes('inset(100%') || clipPath.includes('circle(0') || clipPath.includes('polygon(0')) suspicious.push('clip-path:' + clipPath);
        if (clip && clip !== 'auto' && clip !== 'rect(auto, auto, auto, auto)') suspicious.push('clip:' + clip);
        if (transform.includes('translatex(-') || transform.includes('translate3d(-')) suspicious.push('transform:' + transform);
        if (translate.startsWith('-')) suspicious.push('translate:' + translate);
        if (/^-\d{2,}px$/.test(left)) suspicious.push('left:' + left);
        if (width === '0' || width === '0px') suspicious.push('width:' + width);
        if (height === '0' || height === '0px') suspicious.push('height:' + height);
        if (maxWidth === '0' || maxWidth === '0px') suspicious.push('max-width:' + maxWidth);
        if (maxHeight === '0' || maxHeight === '0px') suspicious.push('max-height:' + maxHeight);
        return suspicious;
    }

    function auditRulesForElement(element, limit) {
        const results = [];
        const seen = new Set();
        let inaccessible = 0;

        function walk(rules, source, depth) {
            if (!rules || depth > 5 || results.length >= limit) return;
            for (const rule of Array.from(rules)) {
                if (results.length >= limit) return;
                if (rule.selectorText && rule.style) {
                    let matches = false;
                    try { matches = element.matches(rule.selectorText); } catch (_) {}
                    if (matches) {
                        const effects = getSuspiciousDeclarations(rule.style);
                        const related = /side.?nav|left.?nav|theatre|theater|channel-root/i.test(rule.selectorText);
                        if (effects.length || related) {
                            const key = source + '|' + rule.selectorText + '|' + rule.cssText;
                            if (!seen.has(key)) {
                                seen.add(key);
                                results.push({
                                    source: source,
                                    selector: rule.selectorText,
                                    effects: effects.length ? effects.join(', ') : 'селектор навигации/театрального режима',
                                    css: String(rule.cssText || '').slice(0, 260)
                                });
                            }
                        }
                    }
                }
                if (rule.cssRules) {
                    try { walk(rule.cssRules, source + ' [' + (rule.conditionText || rule.constructor.name) + ']', depth + 1); }
                    catch (_) {}
                }
            }
        }

        let sheetCount = 0;
        let extensionCount = 0;
        for (const sheet of Array.from(document.styleSheets)) {
            sheetCount++;
            const owner = sheet.ownerNode;
            const id = owner && owner.id ? '#' + owner.id : '';
            const source = sheet.href || ('<style' + id + (owner && owner.tagName ? ' ' + owner.tagName.toLowerCase() : '') + '>');
            if (/^(chrome|moz|safari-web)-extension:\/\//i.test(sheet.href || '')) extensionCount++;
            try { walk(sheet.cssRules, source, 0); }
            catch (_) { inaccessible++; }
        }

        return {
            results: results,
            inaccessible: inaccessible,
            sheetCount: sheetCount,
            extensionCount: extensionCount
        };
    }

    function runCssAudit() {
        clearTimers();
        removeAppliedStyles();

        const candidates = allCandidates();
        const best = bestCandidate();
        const primary = queryOne('#side-nav') || (best ? best.el : null);
        const lines = [];
        lines.push('Twitch sidebar CSS audit v4.1.0');
        lines.push('URL: ' + location.href);
        lines.push('Theatre selector: ' + (theaterDetected() || 'NOT FOUND'));
        lines.push('Stream route: ' + streamRoute() + '; player found: ' + hasPlayer());
        lines.push('Candidate count: ' + candidates.length);
        lines.push('Document stylesheets: ' + document.styleSheets.length);
        lines.push('Legacy sidebar artifacts detected/removed: ' + (LEGACY_SEEN.size ? Array.from(LEGACY_SEEN).join('; ') : 'none detected yet'));
        lines.push('');

        if (!primary) {
            lines.push('NO NAVIGATION CANDIDATE FOUND.');
            lines.push('Either Twitch uses different markup here or the navigation is absent from the DOM.');
            for (const selector of ALL_SELECTORS) {
                lines.push('  ' + selector + ' => ' + queryAll(selector).length);
            }
        } else {
            lines.push('PRIMARY: ' + describe(primary));
            lines.push('id="' + (primary.id || '') + '" class="' +
                (typeof primary.className === 'string' ? primary.className : '') +
                '" aria-label="' + (primary.getAttribute('aria-label') || '') + '"');
            lines.push('');

            let depth = 0;
            for (let el = primary; el && el.nodeType === 1 && depth < 10; el = el.parentElement, depth++) {
                const cs = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const computed = [
                    'display=' + cs.display, 'visibility=' + cs.visibility, 'opacity=' + cs.opacity,
                    'position=' + cs.position, 'left=' + cs.left, 'transform=' + cs.transform,
                    'translate=' + cs.translate, 'size=' + Math.round(rect.width) + 'x' + Math.round(rect.height),
                    'z=' + cs.zIndex, 'pointer=' + cs.pointerEvents, 'overflow=' + cs.overflow,
                    'hidden=' + el.hidden, 'aria-hidden=' + (el.getAttribute('aria-hidden') || '')
                ].join(' | ');
                lines.push('ANCESTOR ' + depth + ': ' + describe(el));
                lines.push('  COMPUTED: ' + computed);
                if (el.getAttribute('style')) lines.push('  INLINE: ' + el.getAttribute('style').slice(0, 500));

                const audit = auditRulesForElement(el, 6);
                for (const item of audit.results) {
                    lines.push('  CSS SOURCE: ' + item.source);
                    lines.push('    SELECTOR: ' + item.selector);
                    lines.push('    EFFECT: ' + item.effects);
                    lines.push('    RULE: ' + item.css);
                }
                if (!audit.results.length) lines.push('  MATCHED HIDE/RELEVANT RULES: none in accessible stylesheets');
                if (depth === 0) {
                    lines.push('  SHEET ACCESS: ' + audit.sheetCount + ' stylesheets; ' +
                        audit.extensionCount + ' extension sheets visible; ' +
                        audit.inaccessible + ' inaccessible sheets.');
                }
                lines.push('');
            }
        }

        const relevantStyles = [];
        for (const node of queryAll('style')) {
            const text = node.textContent || '';
            if (/side.?nav|left.?nav|theatre|theater/i.test(text) ||
                /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/i.test(text)) {
                const label = node.id ? '#' + node.id : '(no id)';
                relevantStyles.push('style' + label + ': ' + text.slice(0, 200).replace(/\s+/g, ' '));
            }
        }
        lines.push('INLINE STYLE ELEMENTS WITH RELEVANT TEXT: ' + relevantStyles.length);
        lines.push.apply(lines, relevantStyles.slice(0, 20).map(item => '  ' + item));

        reportEl.value = lines.join('\n');
        reportEl.style.display = 'block';
        reportEl.scrollTop = 0;
        reportEl.focus();
        reportEl.select();
        previewOpen = false;
        selectedMode = 10;
        setStatus('CSS-аудит готов. Отчёт выделен в поле ниже — нажми Ctrl+C и пришли его целиком. Источник подозрительного правила указан в CSS SOURCE.');
    }

    function selectTarget(mode) {
        if (mode >= 1 && mode <= 5) {
            return { el: queryOne(SELECTORS[mode]), selector: SELECTORS[mode], kind: 'css' };
        }
        if (mode === 6) {
            const best = bestCandidate();
            if (!best) return { el: null, selector: 'родитель лучшего кандидата', kind: 'parent' };
            return { el: best.el.closest('.side-bar-contents') || best.el.parentElement, selector: 'родитель: ' + best.selector, kind: 'parent' };
        }
        if (mode === 7) {
            const best = bestCandidate();
            return { el: best ? best.el : null, selector: best ? best.selector : 'лучший кандидат', kind: 'inline' };
        }
        if (mode === 11) {
            const best = bestCandidate();
            if (!best) return { el: null, selector: 'внешний контейнер side-nav', kind: 'stack' };
            const sideNav = best.el.matches('.side-nav') ? best.el : best.el.closest('.side-nav');
            const outer = sideNav && sideNav.parentElement;
            return {
                el: outer || sideNav || best.el,
                selector: outer ? 'внешний контейнер родителя .side-nav' : (sideNav ? '.side-nav' : best.selector),
                kind: 'stack'
            };
        }
        return { el: null, selector: '', kind: 'none' };
    }
    function runMode(mode, fromHover = false) {
        clearTimers();
        if (mode === 10) {
            runCssAudit();
            return;
        }
        removeAppliedStyles();
        selectedMode = mode;
        openedByHover = fromHover;

        if (mode === 8) {
            const button = currentToggleButton();
            if (!button) {
                setStatus('РЕЖИМ 8: штатная кнопка раскрытия Twitch не найдена. Проверь 1–7 или 9.');
                return;
            }
            const label = ((button.getAttribute('aria-label') || '') + ' ' + (button.getAttribute('title') || '')).toLowerCase();
            const expanded = button.getAttribute('aria-expanded');
            if (expanded === 'false' || /expand/.test(label)) {
                button.click();
                nativeToggleClickedByUs = true;
                nativeToggleButton = button;
                previewOpen = true;
                setStatus('РЕЖИМ 8: нажал штатную кнопку раскрытия Twitch. Если настоящее меню открылось — сообщи «8».\n' + describe(button));
            } else {
                previewOpen = true;
                setStatus('РЕЖИМ 8: кнопка найдена, но выглядит раскрытой. Проверь, появилось ли меню.\n' + describe(button));
            }
            return;
        }
        if (mode === 9) {
            outlined = allCandidates().map(item => item.el);
            outlined.forEach(el => el.classList.add('tts4-outline'));
            previewOpen = false;
            setStatus('РЕЖИМ 9: найденные элементы обведены жёлтым. Напиши «9» и опиши, где видны рамки.');
            return;
        }

        const selected = selectTarget(mode);
        if (!selected.el) {
            setStatus('РЕЖИМ ' + mode + ': селектор не нашёл элемент: ' + selected.selector + '. Проверь другой номер.');
            return;
        }
        activeTarget = selected.el;
        if (selected.kind === 'parent') {
            activeTarget.classList.add('tts4-force-parent');
        } else if (selected.kind === 'inline') {
            forceInline(activeTarget);
        } else if (selected.kind === 'stack') {
            // The audit showed the actual .side-nav lives inside an ancestor with
            // z-index:10 and a stage container with overflow:hidden. Raise the
            // parent stacking context itself, not just #side-nav inside it.
            forceInline(activeTarget);
            setImportant(activeTarget, 'position', 'fixed');
            setImportant(activeTarget, 'top', '0px');
            setImportant(activeTarget, 'left', '0px');
            setImportant(activeTarget, 'right', 'auto');
            setImportant(activeTarget, 'bottom', '0px');
            setImportant(activeTarget, 'width', 'min(280px, 88vw)');
            setImportant(activeTarget, 'min-width', 'min(280px, 88vw)');
            setImportant(activeTarget, 'max-width', '88vw');
            setImportant(activeTarget, 'height', '100vh');
            setImportant(activeTarget, 'max-height', '100vh');
            setImportant(activeTarget, 'overflow', 'visible');
            setImportant(activeTarget, 'z-index', '2147483646');
            setImportant(activeTarget, 'transform', 'none');
            setImportant(activeTarget, 'translate', 'none');
            setImportant(activeTarget, 'pointer-events', 'auto');
            setImportant(activeTarget, 'background', 'transparent');
            setImportant(activeTarget, 'box-shadow', 'none');
        } else {
            activeTarget.classList.add('tts4-force');
        }

        previewOpen = true;
        setStatus('РЕЖИМ ' + mode + ': применён «' + selected.selector + '». Если появилась настоящая панель трансляций — сообщи номер ' + mode + '.\n' + describe(activeTarget));
    }
    function hideKeepMode() {
        clearTimers();
        removeAppliedStyles();
        setStatus('Режим ' + selectedMode + ' выбран, показ сброшен. Теперь наведи курсор на самый левый край — будет проверен этот режим.');
    }
    function resetAll() {
        clearTimers();
        removeAppliedStyles();
        selectedMode = 11;
        reportEl.value = '';
        setStatus('Сброшено. Выбери режим 1–10. Панель диагностики остаётся открытой.');
    }

    modeButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            runMode(Number(button.dataset.mode), false);
        });
    });
    toolbar.querySelector('#tts4-show').addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation(); runMode(selectedMode, false);
    });
    toolbar.querySelector('#tts4-hide').addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation(); hideKeepMode();
    });
    toolbar.querySelector('#tts4-reset').addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation(); resetAll();
    });
    toolbar.querySelector('#tts4-minimize').addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        toolbar.classList.toggle('tts4-minimized');
        toolbar.querySelector('#tts4-minimize').textContent = toolbar.classList.contains('tts4-minimized') ? '+' : '—';
    });

    document.addEventListener('mousemove', event => {
        if (toolbar.contains(event.target)) return;
        if (event.clientX <= EDGE_WIDTH) {
            clearTimeout(hideTimer);
            hideTimer = null;
            if (!previewOpen) {
                clearTimeout(showTimer);
                showTimer = setTimeout(() => runMode(selectedMode, true), SHOW_DELAY);
            }
        } else if (previewOpen && openedByHover && (activeTarget || nativeToggleClickedByUs)) {
            if (hideTimer !== null) return;
            hideTimer = setTimeout(() => {
                hideTimer = null;
                if (activeTarget && activeTarget.matches(':hover')) return;
                removeAppliedStyles();
                setStatus('Режим ' + selectedMode + ' готов к повторной проверке. Наведи на левый край.');
            }, HIDE_DELAY);
        }
    }, { passive: true });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') hideKeepMode();
    });

    window.setInterval(() => {
        cleanupLegacySidebarScripts();
        if (!previewOpen) renderStatus();
    }, 400);

    setStatus('Режим 11 по умолчанию проверяет внешний контейнер панели. При необходимости выбери 1–10 для диагностики.');
})();
