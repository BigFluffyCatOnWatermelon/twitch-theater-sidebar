# Twitch Theater Sidebar on Hover

Tampermonkey userscript that smoothly slides Twitch's **original left navigation** into view when hovering the left edge in theater mode.

## Install

1. Install Tampermonkey.
2. Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Install/update it and reload Twitch.

## Behavior

- No diagnostic toolbar, cloned list, or duplicate sidebar.
- Uses the native navigation and its outer wrapper so it can slide above the theater player.
- Smooth slide-in/slide-out animation with a small edge indicator while hidden.
- Tracks Twitch's collapsed/expanded state. In collapsed mode, the host and native `.side-nav` width shrink together to the icon rail, so the rest of the panel does not remain as a transparent strip.
- The wrapper background is taken from the actual Twitch sidebar theme, preventing a transparent gap if the collapsed rail has a few unused pixels.
- Keeps the panel open while the pointer is over it; closes after moving away, on outside click, or Escape.
- Restores the wrapper's prior custom properties and removes temporary classes when theater mode ends.
- No page-wide MutationObserver; follows theater toggles and SPA replacements with a lightweight poll.
- Honors reduced-motion preferences.

## Automatic updates

The script uses the stable Raw URL in both `@updateURL` and `@downloadURL`. Automatic userscript update checking must be enabled in Tampermonkey.
