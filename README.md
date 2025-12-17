# Nodi (நொடி)
/no-di/ • *noun* • Tamil for "moment" or "second."

**A location-based website blocker for Firefox.**
Block distracting sites instantly when you enter your designated focus zones.ter your designated focus zones.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Firefox](https://img.shields.io/badge/Firefox-109%2B-orange.svg)](https://www.mozilla.org/firefox/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
## Features

- **Zone-based blocking** — Define multiple focus zones with GPS coordinates
- **Pomodoro timer** — 25/5 minute focus/break cycles with customizable intervals
- **Smart exceptions** — Allowlist domains per zone or timer session
- **Quick actions** — Snooze (10/30/60 min) or disable monitoring instantly
- **Theme support** — Dark and light modes
- **Privacy-first** — All data stored locally, no external APIs

## Installation

```bash
npm install
npm run build
```

Load in Firefox:
1. Navigate to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `manifest.json`

## Usage

### Set up a zone
1. Click the extension icon
2. Set your current location as a zone
3. Configure radius (default: 50m)
4. Add domains to block

### Configure timer
1. Open timer settings
2. Set focus/break durations
3. Add domains to block during focus
4. Enable auto-start preferences

### Quick actions
- **Snooze** — Pause monitoring for 10, 30, or 60 minutes
- **Disable for today** — Turn off until midnight
- **Resume** — Reactivate monitoring immediately

## Architecture

```
src/
├── background/     # Service worker, blocking logic
├── popup/          # Extension UI controller
├── options/        # Settings page
├── content/        # Content scripts
├── common/         # Shared utilities (Haversine, storage)
└── types/          # TypeScript definitions

public/             # HTML/CSS assets
dist/               # Compiled output (generated)
```

**Tech stack:** TypeScript, Webpack 5, Firefox WebExtensions API

**Key algorithms:**
- Haversine formula for distance calculation
- `browser.webRequest.onBeforeRequest` for blocking
- `browser.storage.local` for persistence

## Documentation

- [Testing Guide](docs/TESTING.md)
- [Contributing](docs/CONTRIBUTING.md)

## Browser Support

- Firefox 109+
- Zen Browser (Firefox-based)

## License

[MIT](LICENSE) © 2025 Kabe-Innovates
