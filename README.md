# Twitch Theater Sidebar — diagnostic build

This Tampermonkey userscript provides numbered reveal tests and a CSS audit for Twitch's original left navigation. It does not clone channel listings.

## Install / update

Open the [Raw userscript](https://raw.githubusercontent.com/BigFluffyCatOnWatermelon/twitch-theater-sidebar/main/twitch-theater-sidebar.user.js) in Tampermonkey. Automatic update metadata points to this stable Raw URL.

## Important: old copies

Earlier revisions used the name **Twitch Theater Sidebar on Hover**, while the diagnostic build has a different name. Tampermonkey can therefore leave an earlier copy enabled separately. Version 4.2.0 periodically removes old CSS/styles/classes used by the earlier revisions, but it is still recommended to disable any duplicate/old copy in the Tampermonkey dashboard.

The user's other Twitch helper script was checked; it hides a blank spacer and Drops/Rewards buttons in the chat toolbar, not the left navigation.

## Test / diagnose

1. Open a Twitch stream and turn on theater mode.
2. If modes 1–9 do not reveal the panel, press **10. Кто скрывает?**
3. The report shows the candidate element, computed styles on it and ancestors, and matching CSS rules with stylesheet labels. A `chrome-extension://` or `moz-extension://` URL can identify an extension injecting a rule.
4. The report is selected in the text field; press **Ctrl+C** and send the full text.

Mode 10 inspects accessible CSS rules and inline styles. Cross-origin sheets may block rule inspection; that is shown in the report. No page-wide MutationObserver is used.
