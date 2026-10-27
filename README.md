# Twitch Theater Sidebar — diagnostic build

This Tampermonkey userscript provides numbered reveal tests and a CSS audit for Twitch's left navigation. It does not clone channel listings.

## Install / update

Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js) in Tampermonkey. Automatic update metadata points to the stable Raw URL.

## Test / diagnose

1. Open a Twitch stream and turn on theater mode.
2. If modes 1–9 do not reveal the panel, press **10. Кто скрывает?**
3. The report shows the candidate element, computed styles on it and its ancestors, and matching CSS rules with source stylesheet labels. A `chrome-extension://` or `moz-extension://` URL can identify an extension injecting a rule.
4. The report is selected in the text field; press **Ctrl+C** and send the full text.

Mode 10 inspects accessible CSS rules and inline styles. Cross-origin sheets can block CSS rule inspection, which is reported in the diagnostics.

No page-wide MutationObserver is used.
