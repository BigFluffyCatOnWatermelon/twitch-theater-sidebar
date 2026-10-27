# Twitch Theater Sidebar — diagnostic build

This Tampermonkey userscript tests ways to reveal Twitch's **original** left navigation ("For You"). It does not clone the list of streams.

## Install / update

Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js) in Tampermonkey. Automatic updates use the same stable Raw URL.

## Current default: Mode 11

The latest CSS audit for `https://www.twitch.tv/melharucos` showed that `#side-nav` and its ancestors have visible computed styles, with no matching hide rule found in accessible stylesheets. The actual `.side-nav` is inside a wrapper with `position: relative; z-index: 10`, while the stream stage above it has `overflow: hidden`.

Mode **11 — External wrapper** is now the default edge-hover action. It temporarily positions the actual parent wrapper of `.side-nav` above the player, rather than only moving the inner `#side-nav` node.

## Diagnostic modes

1. `#side-nav`
2. aria-label navigation
3. `.side-nav`
4. `data-test-selector`
5. `data-a-target`
6. parent wrapper of the strongest navigation candidate
7. force inline styles on the candidate
8. Twitch's native expand button
9. outline candidate elements
10. CSS audit: computed styles and accessible matching rules
11. external stacking wrapper: intended edge-hover default based on the audit

No page-wide MutationObserver is used.
