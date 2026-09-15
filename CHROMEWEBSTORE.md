# Chrome Web Store Listing — Copy CSS

> Last Updated: 2026-09-15

## Store Listing

**Extension Name**
Copy CSS

**Short Description**
Click any element to copy its HTML and computed CSS as a ready-to-use snippet. Great for cloning UI styles fast.

**Detailed Description**
Copy CSS turns any webpage into a source of ready-to-use HTML and CSS.

Click the toolbar icon to enter picker mode, just like the browser's own inspect-element tool. Hover to highlight elements on the page, then click the one you want — its markup and styles are instantly copied to your clipboard.

What gets copied: clean, indented HTML for the selected element and all of its children, plus a matching style block with the computed CSS for that element and every descendant. Only the CSS that actually differs from the browser's default for that tag is included, so you get a usable snippet instead of thousands of redundant lines.

Paste the result straight into your own project to recreate the look and feel of any element you find on the web.

How to use it: click the Copy CSS icon in your toolbar, move your mouse over the page to see the hovered element highlighted, then click the element you want. Press Escape or click the icon again at any time to cancel without selecting anything.

Copy CSS only runs on the tab you activate it on and only reads what's needed to build the snippet. It doesn't collect, store, or transmit any of your browsing data.

**Category**
Developer Tools

**Single Purpose**
Lets you click any element on a webpage to copy its HTML and computed CSS as a code snippet.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | icons/icon128.png |
| Screenshot 1 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile | 440×280 | ⬜ Not created | |

### Screenshot Notes
Needed before submission — capture in an actual browser session:
1. Picker mode active with an element highlighted (hover overlay visible).
2. The "Copied HTML and CSS to clipboard..." toast after clicking an element.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|----------------|
| activeTab | permissions | Grants temporary access to the current tab only when the user clicks the toolbar icon, so the element picker can be injected without requesting broad access to all tabs. |
| scripting | permissions | Used to inject the element-picker content script into the active tab when the user clicks the toolbar icon. |

No `host_permissions` are requested.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

The extension reads the HTML and computed styles of the element the user clicks and copies a formatted snippet to the system clipboard. Nothing is stored, logged, or transmitted off the device.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|--------------------------|---------|------------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | No (read transiently, not stored) | No | Build the copied HTML/CSS snippet, held only in memory until copied to clipboard | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
https://dmtrsfr.github.io/copy-css/privacy.html

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name**
dmtrsfr

**Contact Email**
dmitriy.sefer@gmail.com

**Support URL / Email**
https://github.com/dmtrsfr/copy-css/issues

**Homepage URL**
https://github.com/dmtrsfr/copy-css

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-09-15 | First public release: element picker, HTML+CSS snippet copy, toast notification | Draft |

## Review Notes

### Known Issues / Limitations
- Screenshots and promo tile not yet captured — required before submission.
- No `chrome.storage` usage; nothing persists between sessions.

### Rejection History
None yet.
