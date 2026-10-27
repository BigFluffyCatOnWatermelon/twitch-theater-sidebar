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
- In theater mode, the script hides both extra labels inside the native channel list and Twitch's separate hover-tooltip portal (`.tw-dialog-layer` containing `.online-side-nav-channel-tooltip__body` or `.side-nav-guest-star-tooltip__body`). The portal lives outside `#side-nav`, so it is suppressed separately and only while theater mode is active. The channel name, viewer count, avatar, links and collapse control remain available; normal-mode tooltips are unaffected.
- Live-channel hover previews use a Twitch thumbnail image (not an iframe player). The header shows the channel display name and current live viewer count; the broadcast title appears on a separate line. Stream title and viewer count are requested from Twitch's internal GraphQL endpoint and briefly cached; until a verified response arrives, the preview does not present an unverified sidebar number as the current count. Channel display name falls back to the Twitch channel URL if needed. Thumbnail URLs are preloaded for visible live channels, cached between hovers and refreshed on a configurable interval. While the image loads, the avatar is used as a placeholder instead of a black rectangle. The preview disappears immediately when the pointer leaves the avatar.
- Open the chat gear menu and choose **Настройки Theater Sidebar** to open the settings dialog. Settings are separated into **Превью**, **Список каналов** and **Анимация**: preview enablement, card width, image refresh interval, category/description visibility, native sidebar auto-collapse and slide-animation speed. Preferences are saved locally.
- The menu entry inherits a native chat-settings menu item's styling and is deduplicated if Twitch re-renders nested menu containers.
- Visual reference: [Previews (for Twitch, YouTube & Kick)](https://chromewebstore.google.com/detail/previews-for-twitch-youtu/hpmbiinljekjjcjgijnlbmgcmoonclah). This userscript uses the hover-preview behavior as inspiration and does not copy its code.
- Keeps the panel open while the pointer is over it; closes after moving away, on outside click, or Escape.
- Restores the wrapper's prior custom properties and removes temporary classes when theater mode ends.
- No page-wide MutationObserver; follows theater toggles and SPA replacements with a lightweight poll.
- Honors reduced-motion preferences.

## Automatic updates

The script uses the stable Raw URL in both `@updateURL` and `@downloadURL`. Automatic userscript update checking must be enabled in Tampermonkey.
