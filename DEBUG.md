# Debug Instructions - Get Location Button

## What Changed
Added detailed console logging to help trace why the "Get Location" button isn't responding.

## Steps to Test

### 1. Reload Extension in Browser
1. Open `about:debugging` in Firefox/Zen
2. Find "Focus Shield" in the list
3. Click the **"Reload"** button (circular arrow icon)
4. Wait for extension to reload (should show "Updated" status)

### 2. Open Developer Tools
1. Press **F12** to open Developer Tools
2. Click the **"Console"** tab
3. Keep this window visible while testing

### 3. Open the Popup
1. Click the Focus Shield icon in the toolbar
2. **In the Console**, you should immediately see:
   ```
   [Focus Shield] Popup script loading...
   [Focus Shield] DOM elements found: { ... all true ... }
   [Focus Shield] Loaded settings: { ... }
   [Focus Shield] Initializing popup...
   [Focus Shield] Popup fully loaded and ready!
   ```

**If you DON'T see these messages**: 
- The popup script isn't loading at all
- Check if the popup.html file is loading correctly

### 4. Click "Set Current Location as Work Zone"
1. Click the button in the popup
2. **In the Console**, watch for:
   ```
   [Focus Shield] Set Location button clicked!
   [Focus Shield] Starting geolocation request...
   ```

**If you DON'T see these messages**:
- The button click event is not attaching
- The script may not be running

### 5. Wait for Location Permission
1. Browser should prompt: "Allow [extension] to access your location?"
2. Click **"Allow"** or **"Share Location"**
3. **In the Console**, watch for:
   ```
   [Focus Shield] Geolocation success: { coords: { ... } }
   [Focus Shield] About to save settings: { zone: {...}, currentPosition: {...} }
   [Focus Shield] Location saved successfully: { lat: ..., lon: ... }
   ```

### 6. Verify Feedback Message
- In the popup, you should see: **"Location Saved!"** message
- The button text should revert to: **"Set Current Location as Work Zone"**

---

## Troubleshooting Based on Logs

### Scenario 1: No console logs appear at all
**Problem**: Popup script not loading  
**Fix**:
- Check if `dist/popup.js` exists: `ls -la dist/popup.js`
- Rebuild: `npm run build`
- Reload extension

### Scenario 2: First batch of logs appear, but button click logs don't
**Problem**: Event listener not attaching  
**Fix**:
- Check DOM elements were found (should all be true)
- The button element ID might not match
- Try clicking the button again
- Check if button is disabled or hidden

### Scenario 3: Button click logs appear, but geolocation logs don't
**Problem**: Geolocation API not working or permission denied  
**Fix**:
- Check browser location settings
- Grant location permission when prompted
- Check if you denied permission earlier (clear browser site permissions)

### Scenario 4: All logs appear, but "Location Saved!" doesn't show
**Problem**: Settings not saving to storage  
**Fix**:
- Check browser storage API is working
- Check if there's an error in the save operation
- Try again - might be temporary issue

---

## What to Report If Still Broken

Please share:
1. **Screenshot** of the browser console when you click the button
2. **What logs appear** (paste the exact console output)
3. **What browser** you're using (Firefox version number)
4. **What happens** when location permission prompt appears

---

## Quick Command Reference

```bash
# Rebuild after changes
npm run build

# Reload extension in about:debugging
# (no command needed, just click reload button in browser)

# Check if popup.js exists
ls -la dist/popup.js

# Check if popup.html references correct script
grep -n "popup.js" public/popup.html
```

---

## What We're Testing

This logging helps us determine where the issue is:

```
Popup Page Loads?
    ↓ [see "Popup script loading...")
Button Click Event Attaches?
    ↓ [see "DOM elements found..."]
User Clicks Button?
    ↓ [see "Set Location button clicked!"]
Geolocation Permission Works?
    ↓ [see "Geolocation success..."]
Storage Save Works?
    ↓ [see "Location saved successfully..."]
Popup Updates UI?
    ↓ [see "Location Saved!" message]
```

Once you reload and test, check the console and let me know what logs you see.
