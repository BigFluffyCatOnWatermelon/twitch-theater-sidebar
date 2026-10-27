# Twitch Theater Sidebar — diagnostic build

This version adds a numbered diagnostic toolbar so we can test how Twitch's real left navigation is found and revealed. It does not clone or create a replacement list of streams; the toolbar is only a temporary debugging control.

## Install / update

Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js) in Tampermonkey. The script uses that stable address for automatic update checks.

## How to test

1. Open a Twitch stream and switch to theater mode.
2. In the top-right corner, use the diagnostic toolbar.
3. Click modes 1–8 one at a time. Each mode tries a different selector/visibility method. Mode 9 outlines matching elements in yellow.
4. If a mode reveals the original Twitch sidebar, tell me its number.
5. For hover testing, click **"Скрыть / тест края"**, then move the pointer to the far-left edge.
6. If no mode works, copy the diagnostic status text from the toolbar. It includes theater detection, candidate count, link count, element size, and CSS visibility.

Modes:
1. `#side-nav`
2. aria-label navigation
3. `.side-nav`
4. `data-test-selector`
5. `data-a-target`
6. parent wrapper of the strongest navigation candidate
7. inline forced styles
8. Twitch's native expand button
9. yellow diagnostic outlines

No page-wide MutationObserver is used.
