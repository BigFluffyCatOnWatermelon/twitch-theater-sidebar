# Twitch Theater Sidebar on Hover

Tampermonkey userscript that smoothly slides Twitch's **original left navigation** into view when hovering the left edge in theater mode.

## Install

1. Install Tampermonkey.
2. Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js).
3. Install/update it and reload Twitch.

## Behavior

- No diagnostic toolbar, cloned list, or duplicate sidebar.
- Uses the native navigation and its outer wrapper so it can slide above the theater player.
- Smooth slide-in/slide-out animation with no decorative strip at the screen edge.
- Automatically uses Twitch's native collapse control in theater mode, leaving only stream avatars visible; restores the prior expanded/collapsed state when leaving theater mode.
- The wrapper background is taken from the actual Twitch sidebar theme, preventing a transparent gap if the collapsed rail has a few unused pixels.
- In theater mode, channel cards keep only the channel name and viewer count; category, description and extra channel labels are hidden only in the native channel list while theater mode is active.
- Hovering a live channel avatar shows a compact **thumbnail image** from Twitch's preview image CDN beside the avatar (no embedded player or iframe). The thumbnail disappears immediately when the pointer leaves the avatar.
- The preview card contains only the channel name and viewer count. Open the chat gear menu and choose **Настройки Theater Sidebar** to enable/disable hover previews. The preference is saved locally.
- Visual reference: [Previews (for Twitch, YouTube & Kick)](https://chromewebstore.google.com/detail/previews-for-twitch-youtu/hpmbiinljekjjcjgijnlbmgcmoonclah). This userscript uses its hover-preview behavior as inspiration and does not copy its code.
- Keeps the panel open while the pointer is over it; closes after moving away, on outside click, or Escape.
- Restores the wrapper's prior custom properties and removes temporary classes when theater mode ends.
- No page-wide MutationObserver; follows theater toggles and SPA replacements with a lightweight poll.
- Honors reduced-motion preferences.

## Automatic updates

The script uses the stable Raw URL in both `@updateURL` and `@downloadURL`. Automatic userscript update checking must be enabled in Tampermonkey.
