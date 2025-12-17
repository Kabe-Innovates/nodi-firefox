import { 
  getSettings, 
  domainMatches, 
  haversine, 
  logBlockedRequest, 
  extractDomain, 
  recordBlockedSite, 
  isWithinSchedule,
  getTimerState,
  saveTimerState,
  calculateRemainingTime,
  completeTimerSession,
  shouldBlockByTimer,
  isTimerAllowingAll,
  domainAllowed,
  isMonitoringActive,
  getMonitoringStatus
} from '../common/utils';
import type { ExtensionSettings, Zone } from '../types/index';

// ============================================
// TIMER TICK INTERVAL
// ============================================

let timerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the timer interval that updates every second
 */
function startTimerInterval() {
  if (timerInterval) return; // Already running
  
  timerInterval = setInterval(async () => {
    try {
      const timer = await getTimerState();
      
      // Skip if not in an active state
      if (timer.state === 'idle' || timer.state === 'paused') {
        return;
      }
      
      // Calculate remaining time
      const remaining = calculateRemainingTime(timer);
      
      // Check if session complete
      if (remaining <= 0) {
        console.log('[Focus Shield] Timer session complete:', timer.state);
        await completeTimerSession();
      }
    } catch (error) {
      console.error('[Focus Shield] Timer interval error:', error);
    }
  }, 1000); // Every second
  
  console.log('[Focus Shield] Timer interval started');
}

// Start timer interval when extension loads
startTimerInterval();

// ============================================
// TAB BLOCKING LOGIC
// ============================================

/**
 * Listen for tab updates to check if we need to block
 */
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when tab starts loading
  if (changeInfo.status !== 'loading' || !tab.url) {
    return;
  }

  try {
    const settings: ExtensionSettings = await getSettings();
    const timer = await getTimerState();
    
    console.log('[Focus Shield] Tab update - monitoring:', settings.monitoring, 'zones:', settings.zones.length, 'timer:', timer.state, 'url:', tab.url);

    // Early exit if not monitoring or snoozed/disabled
    const monitoringStatus = getMonitoringStatus(settings);
    if (!isMonitoringActive(settings)) {
      console.log('[Focus Shield] Monitoring inactive:', monitoringStatus.state, 'until', monitoringStatus.expiresAt);
      return;
    }

    // ==========================================
    // TIMER-BASED BLOCKING (Priority 1)
    // ==========================================
    
    // Check if timer is allowing all sites (during break)
    if (isTimerAllowingAll(timer)) {
      console.log('[Focus Shield] Timer in break mode - allowing all sites');
      return;
    }
    // Timer allowlist short-circuit
    if (domainAllowed(tab.url, timer.timerAllowlist || [])) {
      console.log('[Focus Shield] Allowed by timer allowlist');
      return;
    }
    
    // Check if timer should block this site
    if (shouldBlockByTimer(timer, tab.url)) {
      console.log('[Focus Shield] Blocked by Pomodoro Timer:', tab.url);
      logBlockedRequest(tab.url, 'Blocked during Focus Session');
      
      const domain = extractDomain(tab.url);
      await recordBlockedSite(domain, undefined, true); // fromTimer = true
      
      const remaining = calculateRemainingTime(timer);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      
      const blockedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Blocked by Focus Shield</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; margin: 0; padding: 20px; background: #0f1419; color: #e6e8eb; }
            .container { max-width: 600px; margin: 50px auto; text-align: center; }
            h1 { color: #ef4444; margin: 0 0 10px; }
            .timer { font-size: 48px; font-weight: bold; color: #5b9ff5; margin: 20px 0; }
            p { margin: 10px 0; color: #a4a7ae; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🍅 Blocked by Focus Timer</h1>
            <div class="timer">${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</div>
            <p>This site is blocked during your focus session.</p>
            <p><small>Session ${timer.currentSession} • Stay focused!</small></p>
          </div>
        </body>
        </html>
      `;
      
      browser.tabs.update(tabId, {
        url: 'data:text/html;charset=utf-8,' + encodeURIComponent(blockedHtml)
      });
      
      return; // Don't check zones
    }

    // ==========================================
    // ZONE-BASED BLOCKING (Priority 2)
    // ==========================================
    
    // Check if current position is set
    if (!settings.currentPosition) {
      console.log('[Focus Shield] No current position set');
      return;
    }

    // Get enabled zones
    const enabledZones = settings.zones.filter(z => z.enabled);
    
    if (enabledZones.length === 0) {
      console.log('[Focus Shield] No enabled zones');
      return;
    }

    // Check each zone
    for (const zone of enabledZones) {
      // Allowlist overrides zone blocking
      if (domainAllowed(tab.url, zone.allowlist || [])) {
        console.log('[Focus Shield] Allowed by zone allowlist:', zone.name);
        continue;
      }

      // Check if URL matches this zone's blocklist
      if (!domainMatches(tab.url, zone.blocklist)) {
        continue; // Try next zone
      }

      console.log('[Focus Shield] URL matches zone blocklist:', zone.name, tab.url);

      // Calculate distance to this zone
      const distance = haversine(
        settings.currentPosition.lat,
        settings.currentPosition.lon,
        zone.location.lat,
        zone.location.lon
      );

      console.log('[Focus Shield] Distance from zone', zone.name, ':', distance.toFixed(0), 'm (radius:', zone.radius, 'm)');

      // Check if within this zone's schedule
      if (!isWithinSchedule(zone.timeSchedule)) {
        console.log('[Focus Shield] Outside scheduled hours for zone:', zone.name);
        continue; // Try next zone
      }

      // Block if inside this zone's radius
      if (distance <= zone.radius) {
        logBlockedRequest(tab.url, `Inside ${zone.name} (${distance.toFixed(0)}m)`);
        
        const domain = extractDomain(tab.url);
        await recordBlockedSite(domain, zone.id, false); // zoneId, not fromTimer
        console.log('[Focus Shield] Recorded blocked site:', domain, 'for zone:', zone.name);
        
        const blockedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Blocked by Focus Shield</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; margin: 0; padding: 20px; background: #0f1419; color: #e6e8eb; }
              .container { max-width: 600px; margin: 50px auto; text-align: center; }
              h1 { color: #ef4444; margin: 0 0 10px; }
              .zone-badge { display: inline-block; padding: 6px 12px; background: ${zone.color || '#5b9ff5'}; border-radius: 6px; margin: 10px 0; }
              p { margin: 10px 0; color: #a4a7ae; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🛑 Blocked by Focus Shield</h1>
              <div class="zone-badge">${zone.name}</div>
              <p>This site is blocked while you're in your productivity zone.</p>
              <p><small>Distance: ${distance.toFixed(0)}m | Radius: ${zone.radius}m</small></p>
            </div>
          </body>
          </html>
        `;
        
        browser.tabs.update(tabId, {
          url: 'data:text/html;charset=utf-8,' + encodeURIComponent(blockedHtml)
        });
        
        return; // Stop checking other zones
      }
    }
    
  } catch (error) {
    console.error('[Focus Shield] Tab update handler error:', error);
  }
});

console.log('[Focus Shield] Background service worker initialized');