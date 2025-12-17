# Focus Shield - Quick Start

## Build & Load (2 minutes)

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Navigate to about:debugging in Firefox/Zen
# → Click "Load Temporary Add-on..."
# → Select manifest.json
```

## First Use (3 minutes)

1. **Click extension icon** → Opens popup
2. **Click "Set Location" button** → Grant location permission when prompted
3. **Add domains** in the textarea:
   ```
   youtube.com, reddit.com, instagram.com
   ```
4. **Click "Save Settings"** → Status changes to "Monitoring"
5. **Test** by visiting blocked domains

## How It Works

- **Zone**: Your current location when you click "Set Location"
- **Radius**: How far you can be from the zone before blocking stops (50m default)
- **Blocklist**: Websites blocked only when inside the radius zone
- **Monitoring**: Toggle all blocking on/off

## Example Results

✅ **Blocking Active**: You're within the radius → blocked domains don't load
❌ **Blocking Inactive**: You moved outside the radius → all sites load normally

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Popup shows "Idle" after setting location | You need to click "Save Settings" too |
| Status doesn't change to "Monitoring" | Grant location permission, add domains, ensure radius > 0 |
| Sites load normally when they should block | Check status is "Monitoring", verify you're within the radius |
| No location prompt appears | Check browser location settings, try reloading |
| Build errors | Run `npm install` then `npm run build` |

## Permissions Required

- **geolocation**: To determine your current location
- **storage**: To save your settings persistently
- **tabs**: To intercept and block website requests

## File Structure

```
src/
  background/    → Blocks websites based on location & zone
  popup/         → UI for configuring zones and blocklist
  common/utils/  → Shared functions (distance calc, storage)
  types/         → TypeScript type definitions
public/          → HTML & CSS files
manifest.json    → Extension configuration
```

## Key Features

- ✅ Geolocation-based website blocking
- ✅ Configurable distance radius
- ✅ Custom blocklist per user
- ✅ Persistent settings storage
- ✅ Real-time blocking with distance display
- ✅ Works offline (no external APIs)
