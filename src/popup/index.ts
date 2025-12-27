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
  isMonitoringActive
} from '../common/utils';
import type { Zone, PomodoroTimer, TimerState } from '../types/index';

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

// DOM elements - will be initialized after DOM ready
let statusDot: HTMLElement;
let timerStateBadge: HTMLElement;
let timerTimeDisplay: HTMLElement;
let timerSessionDisplay: HTMLElement;
let timerProgressBar: HTMLElement;
let timerStartBtn: HTMLElement;
let timerPauseBtn: HTMLElement;
let timerResumeBtn: HTMLElement;
let timerResetBtn: HTMLElement;
let focusDurationInput: HTMLInputElement;
let shortBreakInput: HTMLInputElement;
let longBreakInput: HTMLInputElement;
let longBreakIntervalInput: HTMLInputElement;
let timerAutoStartBreaksCheckbox: HTMLInputElement;
let timerAutoStartFocusCheckbox: HTMLInputElement;
let timerNotificationsCheckbox: HTMLInputElement;
let timerBlockDuringFocusCheckbox: HTMLInputElement;
let timerAllowDuringBreakCheckbox: HTMLInputElement;
let timerBlocklistTextarea: HTMLTextAreaElement;
let timerAllowlistTextarea: HTMLTextAreaElement;
let saveTimerConfigBtn: HTMLElement;
let statusDetail: HTMLElement;
let statsSection: HTMLElement;
let statBlockedCount: HTMLElement;
let statTimerSessions: HTMLElement;
let statTopSite: HTMLElement;
let blockedSitesList: HTMLElement;
let resetStatsBtn: HTMLElement;
let addZoneBtn: HTMLElement;
let zonesList: HTMLElement;
let noZonesMessage: HTMLElement;
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
let zoneScheduleEnabledCheckbox: HTMLInputElement;
let zoneScheduleSettings: HTMLElement;
let zoneStartHourInput: HTMLInputElement;
let zoneStartMinuteInput: HTMLInputElement;
let zoneEndHourInput: HTMLInputElement;
let zoneEndMinuteInput: HTMLInputElement;
let zoneColorInput: HTMLInputElement;
let saveZoneBtn: HTMLElement;
let cancelZoneBtn: HTMLElement;
let setCurrentPositionBtn: HTMLElement;
let currentPositionDisplay: HTMLElement;
let manualLatInput: HTMLInputElement;
let manualLonInput: HTMLInputElement;
let setManualPositionBtn: HTMLElement;
let monitoringEnabledCheckbox: HTMLInputElement;
let quickMonitoringToggleBtn: HTMLElement;
let snooze10Btn: HTMLElement;
let snooze30Btn: HTMLElement;
let snooze60Btn: HTMLElement;
let disableTodayBtn: HTMLElement;
let clearSnoozeBtn: HTMLElement;
let feedbackElement: HTMLElement;

/**
 * Initialize all DOM element references
 */
function initDOMElements() {
  statusDot = document.getElementById('status-dot')!;
  timerStateBadge = document.getElementById('timer-state-badge')!;
  timerTimeDisplay = document.getElementById('timer-time')!;
  timerSessionDisplay = document.getElementById('timer-session')!;
  timerProgressBar = document.getElementById('timer-progress-bar') as HTMLElement;
  timerStartBtn = document.getElementById('timer-start')!;
  timerPauseBtn = document.getElementById('timer-pause')!;
  timerResumeBtn = document.getElementById('timer-resume')!;
  timerResetBtn = document.getElementById('timer-reset')!;
  focusDurationInput = document.getElementById('focus-duration') as HTMLInputElement;
  shortBreakInput = document.getElementById('short-break') as HTMLInputElement;
  longBreakInput = document.getElementById('long-break') as HTMLInputElement;
  longBreakIntervalInput = document.getElementById('long-break-interval') as HTMLInputElement;
  timerAutoStartBreaksCheckbox = document.getElementById('timer-auto-start-breaks') as HTMLInputElement;
  timerAutoStartFocusCheckbox = document.getElementById('timer-auto-start-focus') as HTMLInputElement;
  timerNotificationsCheckbox = document.getElementById('timer-notifications') as HTMLInputElement;
  timerBlockDuringFocusCheckbox = document.getElementById('timer-block-during-focus') as HTMLInputElement;
  timerAllowDuringBreakCheckbox = document.getElementById('timer-allow-during-break') as HTMLInputElement;
  timerBlocklistTextarea = document.getElementById('timer-blocklist') as HTMLTextAreaElement;
  timerAllowlistTextarea = document.getElementById('timer-allowlist') as HTMLTextAreaElement;
  saveTimerConfigBtn = document.getElementById('save-timer-config')!;
  statusDetail = document.getElementById('status-detail')!;
  statsSection = document.getElementById('stats-section')!;
  statBlockedCount = document.getElementById('stat-blocked-count')!;
  statTimerSessions = document.getElementById('stat-timer-sessions')!;
  statTopSite = document.getElementById('stat-top-site')!;
  blockedSitesList = document.getElementById('blocked-sites-list')!;
  resetStatsBtn = document.getElementById('reset-stats')!;
  addZoneBtn = document.getElementById('add-zone')!;
  zonesList = document.getElementById('zones-list')!;
  noZonesMessage = document.getElementById('no-zones-message')!;
  zoneForm = document.getElementById('zone-form')!;
  zoneFormTitle = document.getElementById('zone-form-title')!;
  zoneFormId = document.getElementById('zone-form-id') as HTMLInputElement;
  zoneNameInput = document.getElementById('zone-name') as HTMLInputElement;
  zoneSetCurrentLocationBtn = document.getElementById('zone-set-current-location')!;
  zoneLatInput = document.getElementById('zone-lat') as HTMLInputElement;
  zoneLonInput = document.getElementById('zone-lon') as HTMLInputElement;
  zoneRadiusInput = document.getElementById('zone-radius') as HTMLInputElement;
  zoneBlocklistTextarea = document.getElementById('zone-blocklist') as HTMLTextAreaElement;
  zoneAllowlistTextarea = document.getElementById('zone-allowlist') as HTMLTextAreaElement;
  zoneScheduleEnabledCheckbox = document.getElementById('zone-schedule-enabled') as HTMLInputElement;
  zoneScheduleSettings = document.getElementById('zone-schedule-settings')!;
  zoneStartHourInput = document.getElementById('zone-start-hour') as HTMLInputElement;
  zoneStartMinuteInput = document.getElementById('zone-start-minute') as HTMLInputElement;
  zoneEndHourInput = document.getElementById('zone-end-hour') as HTMLInputElement;
  zoneEndMinuteInput = document.getElementById('zone-end-minute') as HTMLInputElement;
  zoneColorInput = document.getElementById('zone-color') as HTMLInputElement;
  saveZoneBtn = document.getElementById('save-zone')!;
  cancelZoneBtn = document.getElementById('cancel-zone')!;
  setCurrentPositionBtn = document.getElementById('set-current-position')!;
  currentPositionDisplay = document.getElementById('current-position-display')!;
  manualLatInput = document.getElementById('manual-lat') as HTMLInputElement;
  manualLonInput = document.getElementById('manual-lon') as HTMLInputElement;
  setManualPositionBtn = document.getElementById('set-manual-position')!;
  monitoringEnabledCheckbox = document.getElementById('monitoring-enabled') as HTMLInputElement;
  quickMonitoringToggleBtn = document.getElementById('quick-monitoring-toggle')!;
  snooze10Btn = document.getElementById('snooze-10')!;
  snooze30Btn = document.getElementById('snooze-30')!;
  snooze60Btn = document.getElementById('snooze-60')!;
  disableTodayBtn = document.getElementById('disable-today')!;
  clearSnoozeBtn = document.getElementById('clear-snooze')!;
  feedbackElement = document.getElementById('feedback')!;
  
  console.log('[Nodi] DOM elements initialized');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function setFeedback(message: string, type: 'success' | 'error' | 'info' = 'info') {
  feedbackElement.textContent = message;
  feedbackElement.style.color = type === 'success' ? '#4ade80' : type === 'error' ? '#ef4444' : '#5b9ff5';
  feedbackElement.style.opacity = '1';
  setTimeout(() => { feedbackElement.style.opacity = '0'; }, 3000);
}

// ============================================
// THEME MANAGEMENT
// ============================================

function applyThemeWithSetting(themeSetting: 'system' | 'light' | 'dark') {
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const useLight = themeSetting === 'light' || (themeSetting === 'system' && prefersLight);
  document.body.classList.toggle('light-theme', useLight);
}

async function loadTheme() {
  const settings = await getSettings();
  const themeSetting = settings.theme ?? 'dark';
  applyThemeWithSetting(themeSetting);
  if (themeSetting === 'system' && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: light)');;
    const handler = () => applyThemeWithSetting('system');
    try {
      media.addEventListener('change', handler);
    } catch {
      // Fallback for older browsers
      media.onchange = handler as any;
    }
  }
}

// Listen for theme changes from options page
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'THEME_CHANGED') {
    console.log('[Nodi Popup] Received theme change:', message.theme);
    applyThemeWithSetting(message.theme);
  }
});

// ============================================
// STATUS DISPLAY
// ============================================
async function updateStatusDisplay() {
  const settings = await getSettings();
  const status = getMonitoringStatus(settings);
  
  statusDot.className = `status-dot ${status.state}`;
  
  if (status.state === 'idle') {
    statusDetail.textContent = 'Monitoring is idle';
  } else if (status.state === 'active') {
    statusDetail.textContent = 'Monitoring is active';
  } else if (status.state === 'snoozed') {
    const remaining = Math.ceil((status.expiresAt! - Date.now()) / 1000 / 60);
    statusDetail.textContent = `Snoozed for ${remaining}m`;
  } else if (status.state === 'disabled') {
    statusDetail.textContent = 'Disabled until tomorrow';
  }
  monitoringEnabledCheckbox.checked = isMonitoringActive(settings);
}

async function setSnooze(minutes: number) {
  const until = Date.now() + minutes * 60 * 1000;
  await saveSettings({ snoozeUntil: until, disabledUntil: null, monitoring: true });
  await updateStatusDisplay();
  setFeedback(`Snoozed for ${minutes} minutes`, 'info');
}

async function disableForToday() {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
  await saveSettings({ disabledUntil: endOfDay, snoozeUntil: null, monitoring: true });
  await updateStatusDisplay();
  setFeedback('Disabled until tomorrow', 'info');
}

// ============================================
// TIMER FUNCTIONS
// ============================================

let timerUpdateInterval: ReturnType<typeof setInterval> | null = null;

async function updateTimerDisplay() {
  const timer = await getTimerState();
  const remaining = calculateRemainingTime(timer);
  
  timerTimeDisplay.textContent = formatTime(remaining);
  timerSessionDisplay.textContent = `Session ${timer.currentSession}`;
  timerStateBadge.textContent = timer.state.replace('-', ' ');
  timerStateBadge.className = `state-badge ${timer.state}`;
  
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

function startTimerUpdateLoop() {
  if (timerUpdateInterval) return;
  
  // Update immediately on start to avoid 1-second lag
  updateTimerDisplay().catch(err => console.error('[Nodi] Timer display error:', err));
  
  timerUpdateInterval = setInterval(async () => {
    const timer = await getTimerState();
    const remaining = calculateRemainingTime(timer);
    
    // Check if timer should complete (handles alarm throttling)
    if (remaining <= 0 && timer.state !== 'idle' && timer.state !== 'paused') {
      console.log('[Nodi] Timer completion detected in popup');
      await completeTimerSession();
    }
    
    await updateTimerDisplay();
  }, 1000);
}

function stopTimerUpdateLoop() {
  if (timerUpdateInterval) {
    clearInterval(timerUpdateInterval);
    timerUpdateInterval = null;
  }
}

async function loadTimerConfig() {
  const timer = await getTimerState();
  focusDurationInput.value = String(Math.floor(timer.focusDuration / 60));
  shortBreakInput.value = String(Math.floor(timer.shortBreakDuration / 60));
  longBreakInput.value = String(Math.floor(timer.longBreakDuration / 60));
  longBreakIntervalInput.value = String(timer.longBreakInterval);
  timerAutoStartBreaksCheckbox.checked = timer.autoStartBreaks;
  timerAutoStartFocusCheckbox.checked = timer.autoStartFocus;
  timerNotificationsCheckbox.checked = timer.notifications;
  timerBlockDuringFocusCheckbox.checked = timer.blockDuringFocus;
  timerAllowDuringBreakCheckbox.checked = timer.allowedDuringBreak;
  timerBlocklistTextarea.value = timer.timerBlocklist.join(', ');
  timerAllowlistTextarea.value = (timer.timerAllowlist || []).join(', ');
}

// ============================================
// ZONES FUNCTIONS
// ============================================

async function renderZones() {
  const settings = await getSettings();
  
  if (settings.zones.length === 0) {
    noZonesMessage.style.display = 'block';
    return;
  }
  
  noZonesMessage.style.display = 'none';
  zonesList.innerHTML = '';
  
  for (const zone of settings.zones) {
    const card = document.createElement('div');
    card.className = 'zone-card';
    card.innerHTML = `
      <div class="zone-card-header">
        <div class="zone-name">
          <span class="zone-color-dot" style="background-color: ${zone.color || '#5b9ff5'}"></span>
          ${zone.name}
        </div>
        <label class="zone-toggle">
          <input type="checkbox" ${zone.enabled ? 'checked' : ''} data-zone-id="${zone.id}" class="zone-toggle-checkbox" />
          <span>${zone.enabled ? 'Active' : 'Inactive'}</span>
        </label>
      </div>
      <div class="zone-details">
        <div class="zone-detail-item">
          <span>Location:</span>
          <span>${zone.location.lat.toFixed(4)}, ${zone.location.lon.toFixed(4)}</span>
        </div>
        <div class="zone-detail-item">
          <span>Radius:</span>
          <span>${zone.radius}m</span>
        </div>
        <div class="zone-detail-item">
          <span>Blocklist:</span>
          <span>${zone.blocklist.length} sites</span>
        </div>
        <div class="zone-detail-item">
          <span>Schedule:</span>
          <span>${zone.timeSchedule.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
      <div class="zone-actions">
        <button class="btn btn-secondary btn-sm zone-edit-btn" data-zone-id="${zone.id}">Edit</button>
        <button class="btn btn-tertiary btn-sm zone-delete-btn" data-zone-id="${zone.id}">Delete</button>
      </div>
    `;
    zonesList.appendChild(card);
  }
  
  // Add event listeners
  document.querySelectorAll('.zone-toggle-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const zoneId = (e.target as HTMLInputElement).dataset.zoneId!;
      await toggleZone(zoneId);
      await renderZones();
      setFeedback('Zone updated', 'success');
    });
  });
  
  document.querySelectorAll('.zone-edit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const zoneId = (e.target as HTMLElement).dataset.zoneId!;
      await showZoneForm(zoneId);
    });
  });
  
  document.querySelectorAll('.zone-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const zoneId = (e.target as HTMLElement).dataset.zoneId!;
      if (confirm('Are you sure you want to delete this zone?')) {
        await deleteZone(zoneId);
        await renderZones();
        setFeedback('Zone deleted', 'success');
      }
    });
  });
}

async function showZoneForm(zoneId?: string) {
  zoneForm.style.display = 'block';
  
  if (zoneId) {
    const settings = await getSettings();
    const zone = settings.zones.find(z => z.id === zoneId);
    if (!zone) return;
    
    zoneFormTitle.textContent = 'Edit Zone';
    zoneFormId.value = zone.id;
    zoneNameInput.value = zone.name;
    zoneLatInput.value = String(zone.location.lat);
    zoneLonInput.value = String(zone.location.lon);
    zoneRadiusInput.value = String(zone.radius);
    zoneBlocklistTextarea.value = zone.blocklist.join(', ');
    zoneAllowlistTextarea.value = (zone.allowlist || []).join(', ');
    zoneScheduleEnabledCheckbox.checked = zone.timeSchedule.enabled;
    zoneScheduleSettings.style.display = zone.timeSchedule.enabled ? 'block' : 'none';
    zoneStartHourInput.value = String(zone.timeSchedule.startHour);
    zoneStartMinuteInput.value = String(zone.timeSchedule.startMinute);
    zoneEndHourInput.value = String(zone.timeSchedule.endHour);
    zoneEndMinuteInput.value = String(zone.timeSchedule.endMinute);
    zoneColorInput.value = zone.color || '#5b9ff5';
    
    const dayCheckboxes = zoneScheduleSettings.querySelectorAll('.day-checkbox input[type="checkbox"]');
    dayCheckboxes.forEach((cb) => {
      const checkbox = cb as HTMLInputElement;
      checkbox.checked = zone.timeSchedule.days.includes(Number(checkbox.value));
    });
  } else {
    zoneFormTitle.textContent = 'Add New Zone';
    zoneFormId.value = '';
    zoneNameInput.value = '';
    zoneLatInput.value = '';
    zoneLonInput.value = '';
    zoneRadiusInput.value = '50';
    zoneBlocklistTextarea.value = '';
    zoneAllowlistTextarea.value = '';
    zoneScheduleEnabledCheckbox.checked = false;
    zoneScheduleSettings.style.display = 'none';
    zoneStartHourInput.value = '9';
    zoneStartMinuteInput.value = '0';
    zoneEndHourInput.value = '17';
    zoneEndMinuteInput.value = '0';
    zoneColorInput.value = '#5b9ff5';
    
    const dayCheckboxes = zoneScheduleSettings.querySelectorAll('.day-checkbox input[type="checkbox"]');
    dayCheckboxes.forEach((cb) => {
      const checkbox = cb as HTMLInputElement;
      checkbox.checked = [1, 2, 3, 4, 5].includes(Number(checkbox.value));
    });
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
  
  if (stats.totalBlocked === 0) {
    statsSection.style.display = 'none';
    return;
  }
  
  statsSection.style.display = 'block';
  statBlockedCount.textContent = String(stats.totalBlocked);
  statTimerSessions.textContent = String(stats.timerStats.sessionsCompleted);
  statTopSite.textContent = stats.blockedSites.length > 0 ? stats.blockedSites[0].domain : '-';
  
  if (stats.blockedSites.length > 0) {
    blockedSitesList.innerHTML = stats.blockedSites.map(site => `
      <div class="blocked-site-item">
        <span class="blocked-site-domain">${site.domain}</span>
        <span class="blocked-site-count">${site.count}</span>
      </div>
    `).join('');
  } else {
    blockedSitesList.innerHTML = '<p style="color: #888; font-size: 12px;">No sites blocked yet</p>';
  }
}
// ============================================
// CURRENT POSITION FUNCTIONS
// ============================================

async function updateCurrentPositionDisplay() {
  const settings = await getSettings();
  
  if (settings.currentPosition) {
    currentPositionDisplay.textContent = `${settings.currentPosition.lat.toFixed(4)}, ${settings.currentPosition.lon.toFixed(4)}`;
    currentPositionDisplay.style.color = '#4ade80';
  } else {
    currentPositionDisplay.textContent = 'Not set';
    currentPositionDisplay.style.color = '#888';
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
  console.log('[Nodi] Attaching event listeners');

// Timer controls
timerStartBtn.addEventListener('click', async () => {
  await startTimer('focus');
  await updateTimerDisplay();
  setFeedback('Focus session started!', 'success');
});

timerPauseBtn.addEventListener('click', async () => {
  await pauseTimer();
  await updateTimerDisplay();
  setFeedback('Timer paused', 'info');
});

timerResumeBtn.addEventListener('click', async () => {
  await resumeTimer();
  await updateTimerDisplay();
  setFeedback('Timer resumed', 'success');
});

timerResetBtn.addEventListener('click', async () => {
  if (confirm('Reset timer to idle?')) {
    await resetTimer();
    await updateTimerDisplay();
    setFeedback('Timer reset', 'info');
  }
});

// Save timer config
saveTimerConfigBtn.addEventListener('click', async () => {
  const focusDuration = Number(focusDurationInput.value) * 60;
  const shortBreakDuration = Number(shortBreakInput.value) * 60;
  const longBreakDuration = Number(longBreakInput.value) * 60;
  const longBreakInterval = Number(longBreakIntervalInput.value);
  const autoStartBreaks = timerAutoStartBreaksCheckbox.checked;
  const autoStartFocus = timerAutoStartFocusCheckbox.checked;
  const notifications = timerNotificationsCheckbox.checked;
  const blockDuringFocus = timerBlockDuringFocusCheckbox.checked;
  const allowedDuringBreak = timerAllowDuringBreakCheckbox.checked;
  const timerBlocklist = parseBlocklist(timerBlocklistTextarea.value);
  const timerAllowlist = parseBlocklist(timerAllowlistTextarea.value);
  
  await saveTimerState({
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    longBreakInterval,
    autoStartBreaks,
    autoStartFocus,
    notifications,
    blockDuringFocus,
    allowedDuringBreak,
    timerBlocklist,
    timerAllowlist
  });
  
  await updateTimerDisplay();
  setFeedback('Timer settings saved!', 'success');
});

// Reset statistics
resetStatsBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all statistics?')) {
    await resetStatistics();
    await loadStatistics();
    setFeedback('Statistics reset', 'info');
  }
});

// Add zone button
addZoneBtn.addEventListener('click', () => {
  showZoneForm();
});

// Cancel zone form
cancelZoneBtn.addEventListener('click', () => {
  hideZoneForm();
});

// Zone schedule enabled toggle
zoneScheduleEnabledCheckbox.addEventListener('change', () => {
  zoneScheduleSettings.style.display = zoneScheduleEnabledCheckbox.checked ? 'block' : 'none';
});

// Zone set current location
zoneSetCurrentLocationBtn.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      zoneLatInput.value = String(pos.coords.latitude);
      zoneLonInput.value = String(pos.coords.longitude);
      setFeedback('Location captured!', 'success');
    },
    (err) => {
      console.error('Geolocation error:', err);
      setFeedback('Failed to get location', 'error');
    }
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
  
  if (!name) {
    setFeedback('Please enter a zone name', 'error');
    return;
  }
  if (isNaN(lat) || isNaN(lon)) {
    setFeedback('Please enter valid coordinates', 'error');
    return;
  }
  if (isNaN(radius) || radius <= 0) {
    setFeedback('Please enter a valid radius', 'error');
    return;
  }
  if (blocklist.length === 0) {
    setFeedback('Please add at least one domain to block', 'error');
    return;
  }
  
  const selectedDays: number[] = [];
  const dayCheckboxes = zoneScheduleSettings.querySelectorAll('.day-checkbox input[type="checkbox"]');
  dayCheckboxes.forEach((cb) => {
    const checkbox = cb as HTMLInputElement;
    if (checkbox.checked) {
      selectedDays.push(Number(checkbox.value));
    }
  });
  
  const timeSchedule = {
    enabled: zoneScheduleEnabledCheckbox.checked,
    startHour: Number(zoneStartHourInput.value),
    startMinute: Number(zoneStartMinuteInput.value),
    endHour: Number(zoneEndHourInput.value),
    endMinute: Number(zoneEndMinuteInput.value),
    days: selectedDays
  };
  
  const zoneId = zoneFormId.value;
  
  if (zoneId) {
    await updateZone(zoneId, {
      name,
      location: { lat, lon },
      radius,
      blocklist,
      allowlist,
      timeSchedule,
      color
    });
    setFeedback('Zone updated!', 'success');
  } else {
    await createZone({
      name,
      location: { lat, lon },
      radius,
      blocklist,
      allowlist,
      timeSchedule,
      enabled: true,
      color
    });
    setFeedback('Zone created!', 'success');
  }
  
  hideZoneForm();
  await renderZones();
});

// Set current position
setCurrentPositionBtn.addEventListener('click', () => {
  setCurrentPositionBtn.textContent = 'Getting location...';
  setCurrentPositionBtn.setAttribute('disabled', 'true');
  
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await saveSettings({
        currentPosition: {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        }
      });
      await updateCurrentPositionDisplay();
      setFeedback('Position updated!', 'success');
      setCurrentPositionBtn.textContent = '📍 Update Current Position';
      setCurrentPositionBtn.removeAttribute('disabled');
    },
    (err) => {
      console.error('Geolocation error:', err);
      setFeedback('Failed to get position', 'error');
      setCurrentPositionBtn.textContent = '📍 Update Current Position';
      setCurrentPositionBtn.removeAttribute('disabled');
    }
  );
});

// Set manual position
setManualPositionBtn.addEventListener('click', async () => {
  const lat = parseFloat(manualLatInput.value);
  const lon = parseFloat(manualLonInput.value);
  
  if (isNaN(lat) || isNaN(lon)) {
    setFeedback('Please enter valid coordinates', 'error');
    return;
  }
  
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    setFeedback('Coordinates out of range', 'error');
    return;
  }
  
  await saveSettings({
    currentPosition: { lat, lon }
  });
  
  await updateCurrentPositionDisplay();
  setFeedback('Position set manually!', 'success');
  manualLatInput.value = '';
  manualLonInput.value = '';
});

// Monitoring enabled toggle
monitoringEnabledCheckbox.addEventListener('change', async () => {
  await saveSettings({
    monitoring: monitoringEnabledCheckbox.checked,
    snoozeUntil: monitoringEnabledCheckbox.checked ? null : undefined,
    disabledUntil: monitoringEnabledCheckbox.checked ? null : undefined
  });
  await updateStatusDisplay();
  setFeedback(monitoringEnabledCheckbox.checked ? 'Monitoring enabled' : 'Monitoring disabled', 'info');
});

// Quick actions
quickMonitoringToggleBtn.addEventListener('click', async () => {
  const settings = await getSettings();
  const next = !isMonitoringActive(settings);
  await saveSettings({ monitoring: next, snoozeUntil: null, disabledUntil: null });
  await updateStatusDisplay();
  setFeedback(next ? 'Monitoring enabled' : 'Monitoring disabled', 'info');
});

snooze10Btn.addEventListener('click', async () => {
  await setSnooze(10);
});

snooze30Btn.addEventListener('click', async () => {
  await setSnooze(30);
});

snooze60Btn.addEventListener('click', async () => {
  await setSnooze(60);
});

disableTodayBtn.addEventListener('click', async () => {
  await disableForToday();
});

clearSnoozeBtn.addEventListener('click', async () => {
  await saveSettings({ snoozeUntil: null, disabledUntil: null, monitoring: true });
  await updateStatusDisplay();
  setFeedback('Monitoring resumed', 'success');
});
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
  console.log('[Nodi] Popup init() called');
  
  // Initialize DOM element references first
  initDOMElements();
  
  // Attach all event listeners
  attachEventListeners();
  
  await loadTheme();
  await updateTimerDisplay();
  await loadTimerConfig();
  await loadStatistics();
  await renderZones();
  await updateCurrentPositionDisplay();
  await updateStatusDisplay();

  startTimerUpdateLoop();
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('beforeunload', () => {
  stopTimerUpdateLoop();
});
