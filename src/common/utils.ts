import type { 
  ExtensionSettings, 
  Statistics, 
  BlockedSite, 
  TimeSchedule, 
  Zone, 
  PomodoroTimer,
  TimerState,
  ZoneStatistics,
  TimerStatistics
} from '../types/index';

/**
 * Convert degrees to radians
 */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate great-circle distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse domain string into an array of domains
 */
export function parseBlocklist(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Check if a URL matches any domain in the allowlist
 */
export function domainAllowed(url: string, allowlist: string[] = []): boolean {
  try {
    const u = new URL(url);
    const host = u.host.replace(/^www\./, '').toLowerCase();
    return allowlist.some((domain) => {
      const d = domain.toLowerCase().trim();
      return host === d || host.endsWith('.' + d);
    });
  } catch {
    return false;
  }
}

/**
 * Check if a URL matches any domain in the blocklist
 */
export function domainMatches(url: string, blocklist: string[]): boolean {
  try {
    const u = new URL(url);
    const host = u.host.replace(/^www\./, '').toLowerCase();
    return blocklist.some((domain) => {
      const d = domain.toLowerCase().trim();
      return host === d || host.endsWith('.' + d);
    });
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * Check if current time is within the configured schedule
 */
export function isWithinSchedule(schedule: TimeSchedule): boolean {
  if (!schedule.enabled) {
    return true; // Always allow if schedule is disabled
  }
  
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ... 6=Saturday
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Check if today is in allowed days
  if (!schedule.days.includes(currentDay)) {
    return false;
  }
  
  // Convert times to minutes for easier comparison
  const currentTime = currentHour * 60 + currentMinute;
  const startTime = schedule.startHour * 60 + schedule.startMinute;
  const endTime = schedule.endHour * 60 + schedule.endMinute;
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Generate a unique ID for zones or other entities
 */
export function generateId(): string {
  return `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get default Pomodoro timer configuration
 */
export function getDefaultTimer(): PomodoroTimer {
  return {
    focusDuration: 1500, // 25 minutes
    shortBreakDuration: 300, // 5 minutes
    longBreakDuration: 900, // 15 minutes
    longBreakInterval: 4,
    state: 'idle',
    currentSession: 0,
    elapsedSeconds: 0,
    remainingSeconds: 1500,
    startedAt: null,
    pausedAt: null,
    autoStartBreaks: false,
    autoStartFocus: false,
    notifications: true,
    soundEnabled: true,
    blockDuringFocus: true,
    allowedDuringBreak: true,
    timerBlocklist: ['youtube.com', 'reddit.com', 'twitter.com', 'facebook.com', 'instagram.com'],
    timerAllowlist: []
  };
}

/**
 * Migrate legacy single zone settings to multi-zone format
 */
async function migrateLegacySettings(data: any): Promise<ExtensionSettings> {
  console.log('[Nodi] Migrating legacy settings to multi-zone format');
  
  const zones: Zone[] = [];
  
  // If old zone exists, convert it to a Zone object
  if (data.zone && data.zone.lat && data.zone.lon) {
    zones.push({
      id: generateId(),
      name: 'Work Zone',
      location: data.zone,
      radius: data.radius || 50,
      blocklist: Array.isArray(data.blocklist) ? data.blocklist : [],
      timeSchedule: data.timeSchedule || {
        enabled: false,
        startHour: 9,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        days: [1, 2, 3, 4, 5]
      },
      enabled: true,
      color: '#5b9ff5'
    });
  }
  
  const migrated: ExtensionSettings = {
    zones,
    monitoring: data.monitoring || false,
    currentPosition: data.currentPosition || null,
    pomodoroTimer: data.pomodoroTimer || getDefaultTimer()
  };
  
  // Save migrated settings
  await browser.storage.local.set({
    zones: migrated.zones,
    monitoring: migrated.monitoring,
    currentPosition: migrated.currentPosition,
    pomodoroTimer: migrated.pomodoroTimer
  });
  
  // Clean up old keys
  await browser.storage.local.remove(['zone', 'radius', 'blocklist', 'timeSchedule']);
  
  console.log('[Nodi] Migration complete:', migrated);
  return migrated;
}

/**
 * Retrieve extension settings from storage
 */
export async function getSettings(): Promise<ExtensionSettings> {
  const data = await browser.storage.local.get([
    'zones',
    'monitoring',
    'currentPosition',
    'pomodoroTimer',
    'snoozeUntil',
    'disabledUntil',
    'theme',
    // Legacy keys for migration
    'zone',
    'radius',
    'blocklist',
    'timeSchedule',
  ]);
  
  // Check if migration needed (has old zone but not new zones)
  if (data.zone && !data.zones) {
    return await migrateLegacySettings(data);
  }

  const now = Date.now();
  const snoozeExpired = data.snoozeUntil && data.snoozeUntil < now;
  const disabledExpired = data.disabledUntil && data.disabledUntil < now;

  if (snoozeExpired) data.snoozeUntil = null;
  if (disabledExpired) data.disabledUntil = null;
  
  return {
    zones: Array.isArray(data.zones) ? data.zones.map((z: Zone) => ({ ...z, allowlist: z.allowlist || [] })) : [],
    monitoring: data.monitoring || false,
    currentPosition: data.currentPosition || null,
    pomodoroTimer: { ...(data.pomodoroTimer || getDefaultTimer()), timerAllowlist: (data.pomodoroTimer && data.pomodoroTimer.timerAllowlist) || [] },
    snoozeUntil: data.snoozeUntil || null,
    disabledUntil: data.disabledUntil || null,
    theme: (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system') ? data.theme : 'dark'
  };
}

/**
 * Save extension settings to storage
 */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  await browser.storage.local.set(settings);
}

/**
 * Get statistics from storage, auto-reset if new day
 */
export async function getStatistics(): Promise<Statistics> {
  const data = await browser.storage.local.get('statistics');
  const now = Date.now();
  
  if (!data.statistics) {
    return {
      totalBlocked: 0,
      blockedSites: [],
      zoneStats: {},
      timerStats: {
        sessionsCompleted: 0,
        totalFocusTime: 0,
        blockedDuringFocus: 0
      },
      sessionStart: now,
      lastUpdated: now,
    };
  }
  
  // Check if we need to reset (new day)
  const existingStats = data.statistics;
  if (existingStats.sessionStart) {
    const lastDate = new Date(existingStats.sessionStart).toDateString();
    const today = new Date(now).toDateString();
    
    if (lastDate !== today) {
      console.log('[Nodi] New day detected, resetting daily statistics');
      const freshStats: Statistics = {
        totalBlocked: 0,
        blockedSites: [],
        zoneStats: {},
        timerStats: {
          sessionsCompleted: 0,
          totalFocusTime: 0,
          blockedDuringFocus: 0
        },
        sessionStart: now,
        lastUpdated: now,
      };
      await browser.storage.local.set({ statistics: freshStats });
      return freshStats;
    }
  }
  
  // Ensure new fields exist for older statistics
  const stats = existingStats;
  if (!stats.zoneStats) stats.zoneStats = {};
  if (!stats.timerStats) {
    stats.timerStats = {
      sessionsCompleted: 0,
      totalFocusTime: 0,
      blockedDuringFocus: 0
    };
  }
  
  return stats;
}

/**
 * Record a blocked site in statistics
 */
export async function recordBlockedSite(domain: string, zoneId?: string, fromTimer: boolean = false): Promise<void> {
  const stats = await getStatistics();
  
  // Update global stats
  let site = stats.blockedSites.find(s => s.domain === domain);
  if (!site) {
    site = { domain, count: 0, lastBlocked: 0, zoneId };
    stats.blockedSites.push(site);
  }
  site.count++;
  site.lastBlocked = Date.now();
  if (zoneId) site.zoneId = zoneId;
  
  stats.totalBlocked++;
  stats.lastUpdated = Date.now();
  
  // Update zone-specific stats if zoneId provided
  if (zoneId) {
    if (!stats.zoneStats[zoneId]) {
      stats.zoneStats[zoneId] = {
        blockedCount: 0,
        blockedSites: [],
        timeInZone: 0
      };
    }
    
    const zoneStats = stats.zoneStats[zoneId];
    zoneStats.blockedCount++;
    
    let zoneSite = zoneStats.blockedSites.find(s => s.domain === domain);
    if (!zoneSite) {
      zoneSite = { domain, count: 0, lastBlocked: 0, zoneId };
      zoneStats.blockedSites.push(zoneSite);
    }
    zoneSite.count++;
    zoneSite.lastBlocked = Date.now();
    
    // Keep only top 10 per zone
    zoneStats.blockedSites.sort((a, b) => b.count - a.count);
    zoneStats.blockedSites = zoneStats.blockedSites.slice(0, 10);
  }
  
  // Update timer stats if blocked during focus
  if (fromTimer) {
    stats.timerStats.blockedDuringFocus++;
  }
  
  // Sort global list by count
  stats.blockedSites.sort((a, b) => b.count - a.count);
  stats.blockedSites = stats.blockedSites.slice(0, 10);
  
  await browser.storage.local.set({ statistics: stats });
}

/**
 * Reset statistics (daily reset)
 */
export async function resetStatistics(): Promise<void> {
  const freshStats: Statistics = {
    totalBlocked: 0,
    blockedSites: [],
    zoneStats: {},
    timerStats: {
      sessionsCompleted: 0,
      totalFocusTime: 0,
      blockedDuringFocus: 0
    },
    sessionStart: Date.now(),
    lastUpdated: Date.now(),
  };
  await browser.storage.local.set({ statistics: freshStats });
}

/**
 * Log blocked request
 */
export function logBlockedRequest(url: string, reason: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] BLOCKED: ${url} - ${reason}`);
}

// ============================================
// TIMER UTILITIES
// ============================================

/**
 * Get timer state from storage
 */
export async function getTimerState(): Promise<PomodoroTimer> {
  const settings = await getSettings();
  return settings.pomodoroTimer;
}

/**
 * Save timer state to storage
 */
export async function saveTimerState(timer: Partial<PomodoroTimer>): Promise<void> {
  const current = await getTimerState();
  const updated = { ...current, ...timer };
  await saveSettings({ pomodoroTimer: updated });
}

/**
 * Determine whether monitoring is currently active (respects snooze/disable windows)
 */
export function isMonitoringActive(settings: ExtensionSettings): boolean {
  const now = Date.now();
  if (!settings.monitoring) return false;
  if (settings.disabledUntil && settings.disabledUntil > now) return false;
  if (settings.snoozeUntil && settings.snoozeUntil > now) return false;
  return true;
}

/**
 * Remaining snooze/disable time helper
 */
export function getMonitoringStatus(settings: ExtensionSettings): { state: 'active' | 'snoozed' | 'disabled' | 'idle'; expiresAt: number | null; } {
  const now = Date.now();
  if (!settings.monitoring) return { state: 'idle', expiresAt: null };
  if (settings.disabledUntil && settings.disabledUntil > now) return { state: 'disabled', expiresAt: settings.disabledUntil };
  if (settings.snoozeUntil && settings.snoozeUntil > now) return { state: 'snoozed', expiresAt: settings.snoozeUntil };
  return { state: 'active', expiresAt: null };
}

/**
 * Calculate remaining time for current timer session
 * Returns 0 if session should have ended (handles alarm delay/throttling)
 */
export function calculateRemainingTime(timer: PomodoroTimer): number {
  if (!timer.startedAt || timer.state === 'idle' || timer.state === 'paused') {
    return timer.remainingSeconds;
  }
  
  const now = Date.now();
  const elapsed = Math.floor((now - timer.startedAt) / 1000);
  
  let duration: number;
  switch (timer.state) {
    case 'focus':
      duration = timer.focusDuration;
      break;
    case 'short-break':
      duration = timer.shortBreakDuration;
      break;
    case 'long-break':
      duration = timer.longBreakDuration;
      break;
    default:
      duration = timer.focusDuration;
  }
  
  const remaining = duration - elapsed;
  
  // Return 0 for negative values (session overdue due to alarm throttling)
  // The caller (alarm handler or popup) should trigger completion
  return Math.max(0, remaining);
}

/**
 * Start a timer session
 * Note: Session count is incremented in completeTimerSession() not here
 */
export async function startTimer(state: TimerState = 'focus'): Promise<void> {
  const timer = await getTimerState();
  
  let duration: number;
  switch (state) {
    case 'focus':
      duration = timer.focusDuration;
      break;
    case 'short-break':
      duration = timer.shortBreakDuration;
      break;
    case 'long-break':
      duration = timer.longBreakDuration;
      break;
    default:
      duration = timer.focusDuration;
  }
  
  await saveTimerState({
    state,
    startedAt: Date.now(),
    pausedAt: null,
    elapsedSeconds: 0,
    remainingSeconds: duration,
    // Don't increment session here - it's done in completeTimerSession after focus completes
  });
}

/**
 * Pause the timer
 */
export async function pauseTimer(): Promise<void> {
  const timer = await getTimerState();
  const remaining = calculateRemainingTime(timer);
  
  await saveTimerState({
    state: 'paused',
    pausedAt: Date.now(),
    remainingSeconds: remaining
  });
}

/**
 * Resume the timer from paused state
 */
export async function resumeTimer(): Promise<void> {
  const timer = await getTimerState();
  
  await saveTimerState({
    state: timer.state === 'paused' ? 'focus' : timer.state,
    startedAt: Date.now(),
    pausedAt: null
  });
}

/**
 * Reset the timer to idle
 */
export async function resetTimer(): Promise<void> {
  const timer = await getTimerState();
  
  await saveTimerState({
    state: 'idle',
    currentSession: 0,
    elapsedSeconds: 0,
    remainingSeconds: timer.focusDuration,
    startedAt: null,
    pausedAt: null
  });
}

/**
 * Handle timer completion and transition to next state
 */
export async function completeTimerSession(): Promise<void> {
  const timer = await getTimerState();
  const stats = await getStatistics();
  
  // Update statistics and session count based on completed session
  if (timer.state === 'focus') {
    stats.timerStats.sessionsCompleted++;
    stats.timerStats.totalFocusTime += timer.focusDuration;
    await browser.storage.local.set({ statistics: stats });
    
    // Increment session count AFTER completing focus (not on start)
    await saveTimerState({
      currentSession: timer.currentSession + 1
    });
  }
  
  // Determine next state
  let nextState: TimerState;
  
  if (timer.state === 'focus') {
    // Decide between short break and long break
    if (timer.currentSession % timer.longBreakInterval === 0) {
      nextState = 'long-break';
    } else {
      nextState = 'short-break';
    }
    
    // Auto-start break if enabled
    if (timer.autoStartBreaks) {
      await startTimer(nextState);
      
      // Show notification
      if (timer.notifications) {
        try {
          await browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('public/icon-48.png'),
            title: 'Focus Session Complete!',
            message: `Great work! ${nextState === 'long-break' ? 'Long' : 'Short'} break started.`,
          });
        } catch (err) {
          console.warn('[Nodi] Notification failed:', err);
        }
      }
    } else {
      // Just transition to idle, user must manually start break
      await saveTimerState({
        state: 'idle',
        remainingSeconds: nextState === 'long-break' ? timer.longBreakDuration : timer.shortBreakDuration
      });
      
      if (timer.notifications) {
        try {
          await browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('public/icon-48.png'),
            title: 'Focus Session Complete!',
            message: 'Time for a break! Click to start.',
          });
        } catch (err) {
          console.warn('[Nodi] Notification failed:', err);
        }
      }
    }
  } else if (timer.state === 'short-break' || timer.state === 'long-break') {
    // Break complete
    if (timer.autoStartFocus) {
      await startTimer('focus');
      
      if (timer.notifications) {
        try {
          await browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('public/icon-48.png'),
            title: 'Break Complete!',
            message: 'Focus session started. Time to work!',
          });
        } catch (err) {
          console.warn('[Nodi] Notification failed:', err);
        }
      }
    } else {
      await saveTimerState({
        state: 'idle',
        remainingSeconds: timer.focusDuration
      });
      
      if (timer.notifications) {
        try {
          await browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('public/icon-48.png'),
            title: 'Break Complete!',
            message: 'Ready to start next focus session?',
          });
        } catch (err) {
          console.warn('[Nodi] Notification failed:', err);
        }
      }
    }
  }
}

/**
 * Format seconds into MM:SS display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if blocking should occur based on timer state
 */
export function shouldBlockByTimer(timer: PomodoroTimer, url: string): boolean {
  // Only block during focus sessions if enabled
  if (timer.state !== 'focus' || !timer.blockDuringFocus) {
    return false;
  }
  // Allowlist wins over blocklist
  if (domainAllowed(url, timer.timerAllowlist || [])) {
    return false;
  }
  
  return domainMatches(url, timer.timerBlocklist);
}

/**
 * Check if timer is allowing all sites (during break)
 */
export function isTimerAllowingAll(timer: PomodoroTimer): boolean {
  return (timer.state === 'short-break' || timer.state === 'long-break') && 
         timer.allowedDuringBreak;
}

// ============================================
// ZONE UTILITIES
// ============================================

/**
 * Create a new zone
 */
export async function createZone(zone: Omit<Zone, 'id'>): Promise<Zone> {
  const newZone: Zone = {
    ...zone,
    id: generateId()
  };
  
  const settings = await getSettings();
  settings.zones.push(newZone);
  await saveSettings({ zones: settings.zones });
  
  return newZone;
}

/**
 * Update an existing zone
 */
export async function updateZone(zoneId: string, updates: Partial<Zone>): Promise<void> {
  const settings = await getSettings();
  const index = settings.zones.findIndex(z => z.id === zoneId);
  
  if (index === -1) {
    throw new Error(`Zone ${zoneId} not found`);
  }
  
  settings.zones[index] = { ...settings.zones[index], ...updates };
  await saveSettings({ zones: settings.zones });
}

/**
 * Delete a zone
 */
export async function deleteZone(zoneId: string): Promise<void> {
  const settings = await getSettings();
  settings.zones = settings.zones.filter(z => z.id !== zoneId);
  await saveSettings({ zones: settings.zones });
}

/**
 * Get a zone by ID
 */
export async function getZoneById(zoneId: string): Promise<Zone | null> {
  const settings = await getSettings();
  return settings.zones.find(z => z.id === zoneId) || null;
}

/**
 * Toggle zone enabled state
 */
export async function toggleZone(zoneId: string): Promise<void> {
  const settings = await getSettings();
  const zone = settings.zones.find(z => z.id === zoneId);
  
  if (zone) {
    zone.enabled = !zone.enabled;
    await saveSettings({ zones: settings.zones });
  }
}
