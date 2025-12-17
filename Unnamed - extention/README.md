# Unnamed - extention (as of now)

Privacy-first Firefox MV3 extension that blocks distracting websites when you are physically inside a configured "Productive Zone".

## Features
- Save current GPS location as your Work Zone
- Configure block radius in meters
- Comma-separated blocklist (e.g., youtube.com, facebook.com)
- Blocks web requests inside the zone using a background service worker

## Files
- `manifest.json` — MV3 manifest (Firefox)
- `background.js` — Blocking engine + distance calculation
- `popup/popup.html` — UI for configuring zone
- `popup/popup.css` — Dark-mode styles
- `popup/popup.js` — Popup logic storing settings in `browser.storage.local`

## Load as a Temporary Add-on (Firefox)
1. Open `about:debugging` in Firefox.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on...**.
4. Select the `manifest.json` file located in `Unnamed - extention/`.

## Notes
- Geolocation attempts are made by the background service worker; if unavailable in that context, it will fall back to any `currentPosition` saved in `browser.storage.local`.
- All data is stored locally using `browser.storage.local`. No external APIs are used.
