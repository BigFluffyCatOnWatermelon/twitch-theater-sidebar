# Twitch Theater Sidebar on Hover

A Tampermonkey userscript that reveals Twitch's **original left navigation** (including the "For You" section) when you hover the left edge in theater mode.

## Install

1. Install Tampermonkey.
2. Open the [raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Confirm installation in Tampermonkey, then reload Twitch.

## Automatic updates

The script includes `@updateURL` and `@downloadURL` metadata pointing to this repository's stable Raw URL. Tampermonkey can check that URL for new versions and install them without reinstalling the script manually.

To make sure updates are enabled:
1. Open the Tampermonkey Dashboard.
2. Open **Settings** and make sure userscript updates / automatic update checking are enabled.
3. Keep this script enabled. When a higher `@version` is published to the same Raw URL, Tampermonkey can detect the new version on its next update check.

The install URL stays the same:
`https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js`

## Behavior

- Uses Twitch's existing `.side-nav` element. It does not create a cloned sidebar or a second panel.
- Reveals the original navigation after hovering near the screen's left edge in theater mode.
- If Twitch has the sidebar collapsed, it uses Twitch's own sidebar toggle to expand it while visible.
- If the script expanded the navigation, it collapses it again after the panel closes. If it was already expanded, the script does not collapse it.
- Hides when the pointer leaves the sidebar, when you click elsewhere, or when you press Escape.
- Watches for Twitch's single-page navigation and sidebar replacement.

The script runs on `https://www.twitch.tv/*` and requests no special Tampermonkey permissions.
