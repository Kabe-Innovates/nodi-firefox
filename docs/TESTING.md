# Focus Shield - Testing Guide

## Prerequisites
- Firefox 109+ or Zen Browser
- Extension built with `npm run build`

## Step-by-Step Testing

### 1. Load Extension in Browser

**Firefox:**
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from the project root
5. Extension should appear in the list

**Zen Browser:**
1. Open `about:debugging`
2. Click "This Zen"
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from the project root

### 2. Open Browser Console & Extension Popup

1. Press `F12` to open Developer Tools
2. Go to "Console" tab to view logs
3. Click the extension icon in the toolbar to open the popup
4. You should see:
   - "Focus Shield" header
   - Status: "Idle" (gray)
   - Set Location button
   - Radius input (default: 50)
   - Blocked Domains textarea
   - Save Settings button

### 3. Grant Location Permission

1. Click "Set Current Location as Work Zone" button
2. Browser may prompt for location access - **Click "Allow"** or "Share"
3. Watch the console for logs like: `[Focus Shield] Location saved: { lat: ..., lon: ... }`
4. You should see feedback: "Location Saved!"
5. Status should remain "Idle" (location is saved, but monitoring not enabled yet)

**Troubleshooting:**
- If no location prompt appears, check browser location settings
- If permission denied, check privacy settings for localhost/extension
- Look for console error messages starting with `[Focus Shield]`

### 4. Configure Blocked Websites

1. In the textarea labeled "Blocked Domains", enter domains (comma-separated):
   ```
   youtube.com, reddit.com, instagram.com
   ```
   - Format: one domain per entry, no spaces required
   - Wildcards: "example.com" blocks "example.com", "www.example.com", "subdomain.example.com"

2. Keep Radius at default (50 meters) for testing
   - This is very restrictive - useful for testing while in one location
   - Increase to 500+ meters for real-world use across a room/floor

3. Click "Save Settings"
4. Watch console for: `[Focus Shield] Saving settings...` and `[Focus Shield] Settings saved successfully:`
5. Status should change to: "Monitoring" (green)
6. You should see feedback: "Settings saved. Monitoring enabled."

**Troubleshooting:**
- If status doesn't change to "Monitoring", check the console for errors
- If Save Settings button does nothing, check that you have:
  - Granted location permission (Step 3)
  - Entered at least one domain in the blocklist
  - Entered a valid radius > 0

### 5. Test Website Blocking

1. In the address bar, navigate to one of your blocked domains (e.g., `youtube.com`)
2. If blocking works, you should see:
   - Page changes to "🛑 Blocked by Focus Shield"
   - Message: "This site is blocked while you're in your Productivity Zone"
   - Distance and radius info displayed

3. Console should show:
   ```
   [Focus Shield] Tab update - monitoring: true, zone: {...}, url: ...
   [Focus Shield] URL matches blocklist: youtube.com
   [Focus Shield] Distance from zone: 15.32 radius: 50
   [TIMESTAMP] BLOCKED: youtube.com - Inside Productivity Zone
   ```

**Troubleshooting:**
- If page loads normally (not blocked):
  - Check status is "Monitoring" in popup
  - Check console logs to see what went wrong
  - Verify distance calculation (distance should be small if you're near where location was set)
  - Make sure radius is not too small or you moved far from where location was set

- If site blocks but distance is very large:
  - You may have moved far from where you set your location
  - Set location again from your current position
  - Reduce radius for testing

### 6. Test Disabling Monitoring

1. Reload the popup (close and reopen)
2. Status should still show "Monitoring" and display your settings
3. To disable: change "monitoring" flag by reloading browser or creating an unblock button
4. When monitoring is off, websites should load normally

## Debug Checklist

If blocking doesn't work, check these in order:

- [ ] Extension loaded in `about:debugging`
- [ ] Status shows "Monitoring" (green) in popup
- [ ] Console shows `[Focus Shield] Background service worker initialized`
- [ ] Location was granted (look for geolocation prompt or console messages)
- [ ] Blocked domain is spelled correctly in blocklist
- [ ] Radius is not extremely small (< 10m)
- [ ] You haven't moved very far from where location was set
- [ ] Manifest has correct permissions: `geolocation`, `storage`, `tabs`
- [ ] No TypeScript/build errors: run `npm run build` to verify

## Browser Storage Inspection

To check what's actually stored:

1. Open browser console (F12)
2. Run:
   ```javascript
   browser.storage.local.get(null).then(data => console.log(data))
   ```
3. You should see object with:
   - `zone`: { lat, lon }
   - `currentPosition`: { lat, lon }
   - `radius`: number
   - `blocklist`: array of domains
   - `monitoring`: boolean

## Example Test Scenario

```
1. Load extension
2. Set location (grant permission when prompted)
3. Add "youtube.com" to blocklist
4. Save settings → Status becomes "Monitoring"
5. Navigate to youtube.com → Should see blocked page
6. Navigate to google.com → Should load normally (not in blocklist)
```

## Notes

- Location must be set before saving settings for monitoring to activate
- Distance is calculated from your current position to your saved work zone
- If distance > radius, sites load normally even if in blocklist
- Blocking only works within the configured radius zone
- Reload the popup to see updates reflected in the UI
