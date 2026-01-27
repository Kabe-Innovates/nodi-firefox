import {
  getSettings,
  saveSettings,
  getStatistics,
  resetStatistics,
  parseBlocklist,
  getTimerState,
  saveTimerState,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  calculateRemainingTime,
  completeTimerSession,
  formatTime,
  createZone,
  updateZone,
  deleteZone,
  toggleZone,
  getMonitoringStatus,
  isMonitoringActive,
  validateCoordinates
} from '../common/utils';
import type { Zone, PomodoroTimer, TimerState } from '../types/index';

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

// DOM elements - will be initialized after DOM ready
let statusIndicator: HTMLElement;
let timerStateBadge: HTMLElement;
let timerTimeDisplay: HTMLElement;
let timerSessionDisplay: HTMLElement;
let timerProgressBar: HTMLElement;
let timerStartBtn: HTMLElement;
let timerPauseBtn: HTMLElement;
let timerResumeBtn: HTMLElement;
let timerResetBtn: HTMLElement;

// Timer config elements REMOVED (using fixed defaults)

let statusText: HTMLElement;
let statsSection: HTMLElement;
let statTimerSessions: HTMLElement;
let resetStatsBtn: HTMLElement;

let addZoneBtn: HTMLElement;
let zonesList: HTMLElement;
// let zonesContainer: HTMLElement; // (unused ref in simplified version)

let zoneForm: HTMLElement;
let zoneFormTitle: HTMLElement;
let zoneFormId: HTMLInputElement;
let zoneNameInput: HTMLInputElement;
let zoneSetCurrentLocationBtn: HTMLElement;
let zoneLatInput: HTMLInputElement;
let zoneLonInput: HTMLInputElement;
let zoneRadiusInput: HTMLInputElement;
let zoneBlocklistTextarea: HTMLTextAreaElement;
let zoneAllowlistTextarea: HTMLTextAreaElement;
let zoneWorkHoursCheckbox: HTMLInputElement;
let zoneColorInput: HTMLInputElement;
let saveZoneBtn: HTMLElement;
let cancelZoneBtn: HTMLElement;

let setCurrentPositionBtn: HTMLElement;
let currentPositionDisplay: HTMLElement;
// Manual GPS inputs REMOVED

let monitoringEnabledCheckbox: HTMLInputElement;
let quickMonitoringToggleBtn: HTMLElement;
let snooze15Btn: HTMLElement; // Replaces multiple snooze buttons
let clearSnoozeBtn: HTMLElement | null; // aka Force Resume (optional)

let feedbackElement: HTMLElement;
let viewHomeTab: HTMLElement;
let viewManageTab: HTMLElement;
let viewHomePanel: HTMLElement;
let viewManagePanel: HTMLElement;

/**
 * Initialize all DOM element references
 */
function initDOMElements() {
  statusIndicator = document.getElementById('status-indicator')!;
  statusText = document.getElementById('status-text')!;

  timerStateBadge = document.getElementById('timer-state-badge')!;
  timerTimeDisplay = document.getElementById('timer-time')!;
  timerSessionDisplay = document.getElementById('timer-session')!;
  timerProgressBar = document.getElementById('timer-progress-bar') as HTMLElement;
  timerStartBtn = document.getElementById('timer-start')!;
  timerPauseBtn = document.getElementById('timer-pause')!;
  timerResumeBtn = document.getElementById('timer-resume')!;
  timerResetBtn = document.getElementById('timer-reset')!;

  statsSection = document.getElementById('stats-section')!;
  statTimerSessions = document.getElementById('stat-timer-sessions')!;
  resetStatsBtn = document.getElementById('reset-stats')!;

  addZoneBtn = document.getElementById('add-zone')!;
  zonesList = document.getElementById('zones-list')!;
  zoneForm = document.getElementById('zone-form')!;
  zoneFormTitle = document.querySelector('.form-header h3') as HTMLElement; // Using query selector for h3 inside header
  zoneFormId = document.getElementById('zone-form-id') as HTMLInputElement;
  zoneNameInput = document.getElementById('zone-name') as HTMLInputElement;
  zoneSetCurrentLocationBtn = document.getElementById('zone-set-current-location')!;
  zoneLatInput = document.getElementById('zone-lat') as HTMLInputElement;
  zoneLonInput = document.getElementById('zone-lon') as HTMLInputElement;
  zoneRadiusInput = document.getElementById('zone-radius') as HTMLInputElement;
  zoneBlocklistTextarea = document.getElementById('zone-blocklist') as HTMLTextAreaElement;
  zoneAllowlistTextarea = document.getElementById('zone-allowlist') as HTMLTextAreaElement;
  zoneWorkHoursCheckbox = document.getElementById('zone-work-hours') as HTMLInputElement;
  zoneColorInput = document.getElementById('zone-color') as HTMLInputElement;
  saveZoneBtn = document.getElementById('save-zone')!;
  cancelZoneBtn = document.getElementById('cancel-zone')!;

  setCurrentPositionBtn = document.getElementById('set-current-position')!;
  currentPositionDisplay = document.getElementById('current-position-display')!;

  monitoringEnabledCheckbox = document.getElementById('monitoring-enabled') as HTMLInputElement;
  quickMonitoringToggleBtn = document.getElementById('quick-monitoring-toggle')!;
  snooze15Btn = document.getElementById('unlock-15')!;
  clearSnoozeBtn = document.getElementById('clear-snooze') as HTMLElement | null;

  feedbackElement = document.getElementById('feedback')!;
  viewHomeTab = document.getElementById('view-home-tab')!;
  viewManageTab = document.getElementById('view-manage-tab')!;
  viewHomePanel = document.getElementById('view-home')!;
  viewManagePanel = document.getElementById('view-manage')!;

  console.log('[Nodi] DOM elements initialized');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setFeedback(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
  feedbackElement.textContent = message;

  feedbackElement.classList.remove('feedback--success', 'feedback--error', 'feedback--info');
  feedbackElement.classList.add(
    type === 'success' ? 'feedback--success' : type === 'error' ? 'feedback--error' : 'feedback--info'
  );
  feedbackElement.classList.add('is-visible');

  setTimeout(() => {
    feedbackElement.classList.remove('is-visible');
  }, duration);
}

// ============================================
// VIEW TOGGLING
// ============================================

function setActiveView(view: 'home' | 'manage') {
  const isHome = view === 'home';
  viewHomeTab.classList.toggle('active', isHome);
  viewManageTab.classList.toggle('active', !isHome);
  viewHomePanel.classList.toggle('active', isHome);
  viewManagePanel.classList.toggle('active', !isHome);

  // Hide forms if switching away
  if (isHome) {
    hideZoneForm();
  }
}

// ============================================
// THEME MANAGEMENT (Simplified: Always Terminal/Dark)
// ============================================
// Note: Keeping basic theme load logic just in case, but CSS is now hardcoded for terminal.
async function loadTheme() {
  // Intentional opacity - themes are effectively locked to the new design
}

// Listen for theme changes from options page
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'THEME_CHANGED') {
    // No-op for now as we enforce terminal theme
  }
});

// ============================================
// STATUS DISPLAY
// ============================================
async function updateStatusDisplay() {
  const settings = await getSettings();
  const status = getMonitoringStatus(settings);

  statusIndicator.className = `${status.state === 'active' ? 'active' : ''} blink`;

  let text = 'IDLE';
  if (status.state === 'active') text = 'MONITORING_ACTIVE';
  else if (status.state === 'snoozed') {
    const remaining = Math.ceil((status.expiresAt! - Date.now()) / 1000 / 60);
    text = `SNOOZED [${remaining}m]`;
  } else if (status.state === 'disabled') {
    text = 'DISABLED_24H';
  }

  statusText.textContent = `STATUS: ${text}`;
  monitoringEnabledCheckbox.checked = isMonitoringActive(settings);
}

async function setSnooze(minutes: number) {
  if (minutes === 0) {
    // Force resume
    await saveSettings({ snoozeUntil: null, disabledUntil: null, monitoring: true });
    setFeedback('RESUMED_NORMAL_OPERATION', 'success');
  } else {
    const until = Date.now() + minutes * 60 * 1000;
    await saveSettings({ snoozeUntil: until, disabledUntil: null, monitoring: true });
    setFeedback(`SYSTEM_UNLOCKED_${minutes}M`, 'info');
  }
  await updateStatusDisplay();
}

// ============================================
// TIMER FUNCTIONS
// ============================================

let timerLoopRunning = false;
let lastTimerUpdateTime = 0;

async function updateTimerDisplay(timerState?: PomodoroTimer, remainingSeconds?: number) {
  const timer = timerState || await getTimerState();
  const remaining = remainingSeconds !== undefined ? remainingSeconds : calculateRemainingTime(timer);

  timerTimeDisplay.textContent = formatTime(remaining);
  timerSessionDisplay.textContent = `${timer.currentSession}`;
  timerStateBadge.textContent = timer.state.toUpperCase().replace('-', '_');
  timerStateBadge.className = `badge ${timer.state}`;

  let duration: number;
  switch (timer.state) {
    case 'focus': duration = timer.focusDuration; break;
    case 'short-break': duration = timer.shortBreakDuration; break;
    case 'long-break': duration = timer.longBreakDuration; break;
    default: duration = timer.focusDuration;
  }

  const progress = timer.state === 'idle' ? 0 : ((duration - remaining) / duration) * 100;
  timerProgressBar.style.width = `${progress}%`;

  if (timer.state === 'idle') {
    timerStartBtn.style.display = 'block';
    timerPauseBtn.style.display = 'none';
    timerResumeBtn.style.display = 'none';
  } else if (timer.state === 'paused') {
    timerStartBtn.style.display = 'none';
    timerPauseBtn.style.display = 'none';
    timerResumeBtn.style.display = 'block';
  } else {
    timerStartBtn.style.display = 'none';
    timerPauseBtn.style.display = 'block';
    timerResumeBtn.style.display = 'none';
  }
}

// Cache timer state to avoid async read on every frame
let cachedTimerState: PomodoroTimer | null = null;
let cacheExpiry = 0;

async function getCachedTimerState(): Promise<PomodoroTimer> {
  const now = Date.now();
  if (!cachedTimerState || now > cacheExpiry) {
    cachedTimerState = await getTimerState();
    cacheExpiry = now + 500; // Refresh cache every 500ms
  }
  return cachedTimerState;
}

function invalidateTimerCache() {
  cachedTimerState = null;
  cacheExpiry = 0;
}

function runTimerLoop(timestamp: number) {
  if (!timerLoopRunning) return;

  const now = Date.now();

  // Update display every second (or on first run)
  if (now - lastTimerUpdateTime >= 1000 || lastTimerUpdateTime === 0) {
    lastTimerUpdateTime = now;

    getCachedTimerState().then(timer => {
      const remaining = calculateRemainingTime(timer);

      // Check for session completion
      if (remaining <= 0 && timer.state !== 'idle' && timer.state !== 'paused') {
        completeTimerSession().then(() => {
          invalidateTimerCache();
          updateTimerDisplay();
        });
      } else {
        // Direct DOM update for speed - avoid async in the hot path
        timerTimeDisplay.textContent = formatTime(remaining);

        let duration: number;
        switch (timer.state) {
          case 'focus': duration = timer.focusDuration; break;
          case 'short-break': duration = timer.shortBreakDuration; break;
          case 'long-break': duration = timer.longBreakDuration; break;
          default: duration = timer.focusDuration;
        }
        const progress = timer.state === 'idle' ? 0 : ((duration - remaining) / duration) * 100;
        timerProgressBar.style.width = `${progress}%`;
      }
    }).catch(err => {
      console.error('[Nodi] Timer loop error:', err);
    });
  }

  // Continue the loop
  if (timerLoopRunning) {
    requestAnimationFrame(runTimerLoop);
  }
}

function startTimerUpdateLoop() {
  if (timerLoopRunning) return;
  timerLoopRunning = true;
  lastTimerUpdateTime = 0; // Force immediate update

  // Initial full display update
  updateTimerDisplay().catch(err => console.error('[Nodi] Timer display error:', err));

  // Start the animation frame loop
  requestAnimationFrame(runTimerLoop);
}

function stopTimerUpdateLoop() {
  timerLoopRunning = false;
  cachedTimerState = null;
}

// Config removed - standard Pomo is assumed.

// ============================================
// ZONES FUNCTIONS
// ============================================

async function renderZones() {
  const settings = await getSettings();

  zonesList.innerHTML = '';

  if (settings.zones.length === 0) {
    zonesList.innerHTML = '<div class="terminal-msg">NO_ZONES_CONFIGURED</div>';
    return;
  }

  for (const zone of settings.zones) {
    const item = document.createElement('div');
    item.className = 'zone-item';

    const lat = zone.location?.lat ? zone.location.lat.toFixed(4) : '?.????';

    item.innerHTML = `
      <div class="zone-info grow">
        <div style="font-weight:700; color: ${zone.color || '#fff'}">${zone.name}</div>
        <div style="font-size:10px; color:var(--text-secondary)">
           [R:${zone.radius}m] ${zone.enabled ? 'ACTIVE' : 'OFF'}
        </div>
      </div>
      <div class="zone-actions row" style="gap:4px">
        <button class="btn-text zone-edit-btn" data-zone-id="${zone.id}">[EDIT]</button>
        <button class="btn-text zone-delete-btn" data-zone-id="${zone.id}">[DEL]</button>
      </div>
    `;
    zonesList.appendChild(item);
  }

  document.querySelectorAll('.zone-edit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const zoneId = (e.target as HTMLElement).dataset.zoneId!;
      await showZoneForm(zoneId);
    });
  });

  document.querySelectorAll('.zone-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const zoneId = (e.target as HTMLElement).dataset.zoneId!;
      if (confirm('CONFIRM_DELETE_ZONE?')) {
        await deleteZone(zoneId);
        await renderZones();
        setFeedback('ZONE_DELETED', 'success');
      }
    });
  });
}

async function showZoneForm(zoneId?: string) {
  setActiveView('manage');
  zoneForm.style.display = 'block';

  if (zoneId) {
    const settings = await getSettings();
    const zone = settings.zones.find(z => z.id === zoneId);
    if (!zone) return;

    zoneFormId.value = zone.id;
    zoneFormTitle.textContent = '>> EDIT_ZONE'; // Header text

    zoneNameInput.value = zone.name;
    zoneLatInput.value = String(zone.location.lat);
    zoneLonInput.value = String(zone.location.lon);
    zoneRadiusInput.value = String(zone.radius);
    zoneBlocklistTextarea.value = zone.blocklist.join(', ');
    zoneAllowlistTextarea.value = (zone.allowlist || []).join(', ');

    // Check if it matches "Standard Work Hours"
    // We simplify: if enabled, we assume it's work hours for UI purposes
    zoneWorkHoursCheckbox.checked = zone.timeSchedule.enabled;

    zoneColorInput.value = zone.color || '#5b9ff5';
  } else {
    zoneFormId.value = '';
    zoneFormTitle.textContent = '>> NEW_ZONE';

    zoneNameInput.value = '';
    zoneLatInput.value = '';
    zoneLonInput.value = '';
    zoneRadiusInput.value = '50';
    zoneBlocklistTextarea.value = '';
    zoneAllowlistTextarea.value = '';
    zoneWorkHoursCheckbox.checked = true; // Default to work hours
    zoneColorInput.value = '#5b9ff5';
  }

  zoneForm.scrollIntoView({ behavior: 'smooth' });
}

function hideZoneForm() {
  zoneForm.style.display = 'none';
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

async function loadStatistics() {
  const stats = await getStatistics();

  if (stats.timerStats.sessionsCompleted === 0) {
    // Could hide, but terminal logs usually show 0
  }

  statsSection.style.display = 'block';
  statTimerSessions.textContent = String(stats.timerStats.sessionsCompleted);
}

// ============================================
// CURRENT POSITION FUNCTIONS
// ============================================

async function updateCurrentPositionDisplay() {
  const settings = await getSettings();

  if (settings.currentPosition) {
    currentPositionDisplay.textContent = `${settings.currentPosition.lat.toFixed(4)}, ${settings.currentPosition.lon.toFixed(4)}`;
    currentPositionDisplay.style.color = '#00ff41';
  } else {
    currentPositionDisplay.textContent = 'UNKNOWN';
    currentPositionDisplay.style.color = '#757575';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
  console.log('[Nodi] Attaching event listeners');

  viewHomeTab.addEventListener('click', () => setActiveView('home'));
  viewManageTab.addEventListener('click', () => setActiveView('manage'));

  // Timer controls
  timerStartBtn.addEventListener('click', async () => {
    await startTimer('focus');
    invalidateTimerCache();
    await updateTimerDisplay();
  });

  timerPauseBtn.addEventListener('click', async () => {
    await pauseTimer();
    invalidateTimerCache();
    await updateTimerDisplay();
  });

  timerResumeBtn.addEventListener('click', async () => {
    await resumeTimer();
    invalidateTimerCache();
    await updateTimerDisplay();
  });

  timerResetBtn.addEventListener('click', async () => {
    await resetTimer();
    invalidateTimerCache();
    await updateTimerDisplay();
  });

  // Reset statistics
  resetStatsBtn.addEventListener('click', async () => {
    await resetStatistics();
    await loadStatistics();
    setFeedback('LOGS_FLUSHED', 'info');
  });

  // Add zone button
  addZoneBtn.addEventListener('click', () => {
    setActiveView('manage');
    showZoneForm();
  });

  // Cancel zone form
  cancelZoneBtn.addEventListener('click', () => {
    hideZoneForm();
  });

  // Zone set current location
  zoneSetCurrentLocationBtn.addEventListener('click', () => {
    zoneSetCurrentLocationBtn.textContent = 'SCANNING...';
    zoneSetCurrentLocationBtn.setAttribute('disabled', 'true');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const validation = validateCoordinates(lat, lon);

        zoneLatInput.value = String(lat);
        zoneLonInput.value = String(lon);

        if (validation.error && !validation.valid) {
          setFeedback('INVALID_COORDS', 'error');
        } else {
          setFeedback('COORDS_ACQUIRED', 'success');
        }

        zoneSetCurrentLocationBtn.textContent = 'GET_GPS_DATA';
        zoneSetCurrentLocationBtn.removeAttribute('disabled');
      },
      (err) => {
        console.error('[Nodi] Geolocation error:', err);
        setFeedback('GPS_ERROR', 'error');
        zoneSetCurrentLocationBtn.textContent = 'GET_GPS_DATA';
        zoneSetCurrentLocationBtn.removeAttribute('disabled');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });

  // Save zone
  saveZoneBtn.addEventListener('click', async () => {
    const name = zoneNameInput.value.trim();
    const lat = parseFloat(zoneLatInput.value);
    const lon = parseFloat(zoneLonInput.value);
    const radius = parseInt(zoneRadiusInput.value);
    const blocklist = parseBlocklist(zoneBlocklistTextarea.value);
    const allowlist = parseBlocklist(zoneAllowlistTextarea.value);
    const color = zoneColorInput.value;

    if (!name) { setFeedback('NAME_REQUIRED', 'error'); return; }

    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) { setFeedback(coordValidation.error || 'INVALID_COORDS', 'error'); return; }

    if (isNaN(radius) || radius <= 0) { setFeedback('INVALID_RADIUS', 'error'); return; }

    // Simplified Schedule Logic
    const isWorkHours = zoneWorkHoursCheckbox.checked;
    const timeSchedule = {
      enabled: isWorkHours,
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
      days: [1, 2, 3, 4, 5] // Mon-Fri
    };

    const zoneId = zoneFormId.value;
    const zoneData = {
      name, location: { lat, lon }, radius, blocklist, allowlist, timeSchedule, color
    };

    if (zoneId) {
      await updateZone(zoneId, zoneData);
      setFeedback('ZONE_UPDATED', 'success');
    } else {
      await createZone({ ...zoneData, enabled: true });
      setFeedback('ZONE_CREATED', 'success');
    }

    hideZoneForm();
    await renderZones();
  });

  // Set current position
  setCurrentPositionBtn.addEventListener('click', () => {
    setCurrentPositionBtn.textContent = 'SCANNING...';
    setCurrentPositionBtn.setAttribute('disabled', 'true');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const validation = validateCoordinates(lat, lon);
        if (!validation.valid) {
          setFeedback('INVALID_GPS_DATA', 'error');
        } else {
          await saveSettings({ currentPosition: { lat, lon } });
          await updateCurrentPositionDisplay();
          setFeedback('POSITION_UPDATED', 'success');
        }
        setCurrentPositionBtn.textContent = 'UPDATE_POS';
        setCurrentPositionBtn.removeAttribute('disabled');
      },
      (err) => {
        setFeedback('GPS_TIMEOUT', 'error');
        setCurrentPositionBtn.textContent = 'UPDATE_POS';
        setCurrentPositionBtn.removeAttribute('disabled');
      },
      { timeout: 10000 }
    );
  });

  // Monitoring toggle
  quickMonitoringToggleBtn.addEventListener('click', async () => {
    const settings = await getSettings();
    const newState = !settings.monitoring;
    // Clear any temporary states if we are manually toggling
    await saveSettings({ monitoring: newState, snoozeUntil: null, disabledUntil: null });
    await updateStatusDisplay();
  });

  // Unlocks
  snooze15Btn.addEventListener('click', () => setSnooze(15));
  if (clearSnoozeBtn) {
    clearSnoozeBtn.addEventListener('click', () => setSnooze(0));
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  initDOMElements();
  attachEventListeners();

  await loadTheme();
  await updateStatusDisplay();
  await updateTimerDisplay();
  await updateCurrentPositionDisplay();
  await loadStatistics();

  // Render zones only if manage tab active, but initial render is empty anyway
  await renderZones();

  startTimerUpdateLoop();

  // Storage listener
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.monitoring || changes.snoozeUntil || changes.disabledUntil) {
        updateStatusDisplay();
      }
      if (changes.pomodoroTimer) {
        updateTimerDisplay();
      }
      if (changes.currentPosition) {
        updateCurrentPositionDisplay();
      }
      if (changes.statistics) {
        loadStatistics();
      }
    }
  });
});

window.addEventListener('unload', () => {
  stopTimerUpdateLoop();
});
