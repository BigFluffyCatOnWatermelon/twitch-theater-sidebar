# Twitch Theater Sidebar on Hover

Tampermonkey userscript that slides Twitch's **existing native left navigation** ("For You") into view when the left edge is hovered in theater mode. It does not clone channel entries or create a replacement panel.

## Install

1. Install Tampermonkey.
2. Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Confirm installation and reload Twitch.

## Automatic updates

The userscript declares `@updateURL` and `@downloadURL` pointing at the stable Raw URL for the `main` branch. Enable automatic userscript update checking in Tampermonkey settings.

## Behavior

- Repositions Twitch's own left-navigation element; no copied channel list is created.
- Detects theater mode with Twitch-specific selectors and a player-geometry fallback.
- If Twitch changes its theater class names, hovering the left edge on a live channel page can temporarily reveal the native navigation.
- Uses Twitch's expand control only if the navigation is collapsed, and restores that state after closing.
- Avoids a page-wide MutationObserver to prevent unnecessary work during Twitch React updates.

If the panel is still missing, verify that the script is enabled and that Tampermonkey has installed the latest version.
