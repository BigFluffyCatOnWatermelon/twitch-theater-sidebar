# Twitch Theater Sidebar on Hover

Tampermonkey userscript that slides Twitch's followed-streams sidebar out from the left edge while the player is in theater mode.

## Install

1. Install the Tampermonkey browser extension.
2. Open the [raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Confirm installation in Tampermonkey and reload Twitch.

## Behavior

- Hover near the left edge of the screen in theater mode to reveal the sidebar.
- Move the pointer away from the panel to hide it.
- Press Escape or click the close icon to hide it immediately.
- Stream links use Twitch's original sidebar links when available.

The script runs on `https://www.twitch.tv/*` and does not request special Tampermonkey permissions.
