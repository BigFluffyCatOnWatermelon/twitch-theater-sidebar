# Twitch Theater Sidebar on Hover

Tampermonkey userscript that smoothly slides Twitch's **original left navigation** (the "For You" sidebar) into view when hovering the left edge in theater mode.

## Install

1. Install Tampermonkey.
2. Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Install/update it and reload Twitch.

## Behavior

- No diagnostic toolbar, cloned list, or duplicate sidebar.
- Reuses the native navigation and the outer wrapper confirmed to work on Twitch's current layout.
- Smooth slide-in/slide-out animation with a subtle edge handle while hidden.
- Keeps the panel open while the pointer is over it; closes after moving away, on outside click, or Escape.
- Removes its temporary layout classes and restores the wrapper's original width property when theater mode ends. Twitch's normal layout styles are otherwise not changed.
- Responds directly to the theater-mode toggle and checks SPA state every 500 ms as a fallback.
- Honors reduced-motion settings.

## Automatic updates

The script uses the stable Raw URL in both `@updateURL` and `@downloadURL`. Automatic userscript update checking must be enabled in Tampermonkey.

If you still see the old diagnostic toolbar, disable any separate old **Twitch Theater Sidebar — Diagnostic Modes** copy in Tampermonkey and keep only this script enabled.
