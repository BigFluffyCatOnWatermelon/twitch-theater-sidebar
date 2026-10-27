# Twitch Theater Sidebar on Hover

Tampermonkey userscript that moves Twitch's **existing left navigation** (the "For You" sidebar) into view when hovering the left edge in theater mode. It does not create a cloned sidebar.

## Install

1. Install Tampermonkey.
2. Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Confirm installation and reload Twitch.

## Automatic updates

The script declares `@updateURL` and `@downloadURL` pointing at the stable `main` Raw URL. Enable automatic userscript update checking in Tampermonkey's settings.

For an immediate, cache-independent download of a specific published version, use the immutable commit URL from the latest commit page.

## Troubleshooting

- Check the script is enabled in Tampermonkey.
- In the Twitch theatre/player page, move the cursor all the way to the left edge.
- If the sidebar doesn't appear, report the browser console errors and your current userscript version in the repository's Issues section.

## Notes

- The native Twitch navigation is repositioned; no second panel or copied channel list is created.
- The script avoids a page-wide `MutationObserver` to reduce the risk of slowing Twitch's frequently rerendered UI.
- It runs on `https://www.twitch.tv/*` and requests no special Tampermonkey permissions.
