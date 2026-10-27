# Twitch Theater Sidebar on Hover

A Tampermonkey userscript that reveals Twitch's **original left navigation** (including the "For You" section) when you hover the left edge in theater mode.

## Install

1. Install Tampermonkey.
2. Open the [raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Confirm the installation in Tampermonkey, then reload Twitch.

## Behavior

- Uses Twitch's existing `.side-nav` element. It does not create a cloned sidebar or a second panel.
- Reveals the original navigation after hovering near the screen's left edge in theater mode.
- If Twitch has the sidebar collapsed, it uses Twitch's own sidebar toggle to expand it while visible.
- If the script expanded the navigation, it collapses it again after the panel closes. If it was already expanded, the script does not collapse it.
- Hides when the pointer leaves the sidebar, when you click elsewhere, or when you press Escape.
- Watches for Twitch's single-page navigation and sidebar replacement.

The script runs on `https://www.twitch.tv/*` and requests no special Tampermonkey permissions.
