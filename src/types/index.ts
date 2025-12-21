export interface GeoLocation {
  lat: number;
  lon: number;
}

export interface TimeSchedule {
  enabled: boolean;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
  days: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
}

export interface Zone {
  id: string; // Unique identifier
  name: string; // User-friendly name (e.g., "Office", "Library")
  location: GeoLocation; // Center point of the zone
  radius: number; // Radius in meters
  blocklist: string[]; // Domains to block in this zone
  allowlist?: string[]; // Domains to allow even inside this zone
  timeSchedule: TimeSchedule; // When this zone is active
  enabled: boolean; // Whether this zone is currently active
  color?: string; // Optional color for UI identification
}

export type TimerState = 'idle' | 'focus' | 'short-break' | 'long-break' | 'paused';

export interface PomodoroTimer {
  // Configuration
  focusDuration: number; // In seconds (default: 1500 = 25 min)
  shortBreakDuration: number; // In seconds (default: 300 = 5 min)
  longBreakDuration: number; // In seconds (default: 900 = 15 min)
  longBreakInterval: number; // After how many focus sessions (default: 4)
  
  // Runtime state
  state: TimerState;
  currentSession: number; // Which session number (1, 2, 3, 4...)
  elapsedSeconds: number; // Time elapsed in current session
  remainingSeconds: number; // Time remaining in current session
  startedAt: number | null; // Timestamp when timer started
  pausedAt: number | null; // Timestamp when timer paused
  
  // Settings
  autoStartBreaks: boolean; // Auto-start breaks after focus
  autoStartFocus: boolean; // Auto-start focus after break
  notifications: boolean; // Show browser notifications
  soundEnabled: boolean; // Play completion sound
  
  // Block behavior
  blockDuringFocus: boolean; // Enable blocking during focus sessions
  allowedDuringBreak: boolean; // Disable blocking during breaks
  timerBlocklist: string[]; // Domains to block during focus
  timerAllowlist?: string[]; // Domains to always allow during focus
}

export interface ExtensionSettings {
  zones: Zone[]; // Multiple zones support
  monitoring: boolean;
  currentPosition: GeoLocation | null;
  pomodoroTimer: PomodoroTimer;
  snoozeUntil?: number | null; // Timestamp when snooze expires
  disabledUntil?: number | null; // Timestamp when disabled state expires
  theme?: 'system' | 'light' | 'dark'; // User's theme preference (default: 'system')
  
  // Legacy fields for migration (will be removed after migration)
  zone?: GeoLocation | null;
  radius?: number;
  blocklist?: string[];
  timeSchedule?: TimeSchedule;
}

export interface WebRequest {
  url: string;
  tabId: number;
  method: string;
  timeStamp: number;
}

export interface BlockedSite {
  domain: string;
  count: number;
  lastBlocked: number; // timestamp
  zoneId?: string; // Which zone caused the block
}

export interface ZoneStatistics {
  blockedCount: number;
  blockedSites: BlockedSite[];
  timeInZone: number; // Milliseconds
}

export interface TimerStatistics {
  sessionsCompleted: number; // Total Pomodoro sessions completed
  totalFocusTime: number; // Total seconds in focus mode
  blockedDuringFocus: number; // Sites blocked during focus
}

export interface Statistics {
  totalBlocked: number; // Total blocks across all zones
  blockedSites: BlockedSite[]; // Top blocked sites overall
  zoneStats: { [zoneId: string]: ZoneStatistics }; // Per-zone statistics
  timerStats: TimerStatistics; // Timer-specific statistics
  sessionStart: number; // When current session started
  lastUpdated: number; // Last timestamp stats were updated
}
