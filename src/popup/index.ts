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

// Theme toggle element
const themeToggle = document.getElementById('themeToggle')!;

// Status dot element
const statusDot = document.getElementById('status-dot')!;
const timerStateBadge = document.getElementById('timer-state-badge')!;
const timerTimeDisplay = document.getElementById('timer-time')!;
const timerSessionDisplay = document.getElementById('timer-session')!;
const timerProgressBar = document.getElementById('timer-progress-bar') as HTMLElement;
const timerStartBtn = document.getElementById('timer-start')!;
const timerPauseBtn = document.getElementById('timer-pause')!;
const timerResumeBtn = document.getElementById('timer-resume')!;
const timerResetBtn = document.getElementById('timer-reset')!;

// Timer config elements
const focusDurationInput = document.getElementById('focus-duration') as HTMLInputElement;
const shortBreakInput = document.getElementById('short-break') as HTMLInputElement;
const longBreakInput = document.getElementById('long-break') as HTMLInputElement;
const longBreakIntervalInput = document.getElementById('long-break-interval') as HTMLInputElement;
const timerAutoStartBreaksCheckbox = document.getElementById('timer-auto-start-breaks') as HTMLInputElement;
const timerAutoStartFocusCheckbox = document.getElementById('timer-auto-start-focus') as HTMLInputElement;
const timerNotificationsCheckbox = document.getElementById('timer-notifications') as HTMLInputElement;
const timerBlockDuringFocusCheckbox = document.getElementById('timer-block-during-focus') as HTMLInputElement;
const timerAllowDuringBreakCheckbox = document.getElementById('timer-allow-during-break') as HTMLInputElement;
const timerBlocklistTextarea = document.getElementById('timer-blocklist') as HTMLTextAreaElement;
const timerAllowlistTextarea = document.getElementById('timer-allowlist') as HTMLTextAreaElement;
const saveTimerConfigBtn = document.getElementById('save-timer-config')!;

// Status and stats elements
const statusDetail = document.getElementById('status-detail')!;
const statsSection = document.getElementById('stats-section')!;
const statBlockedCount = document.getElementById('stat-blocked-count')!;
const statTimerSessions = document.getElementById('stat-timer-sessions')!;
const statTopSite = document.getElementById('stat-top-site')!;
const blockedSitesList = document.getElementById('blocked-sites-list')!;
const resetStatsBtn = document.getElementById('reset-stats')!;

// Zones elements
const addZoneBtn = document.getElementById('add-zone')!;
const zonesList = document.getElementById('zones-list')!;
const noZonesMessage = document.getElementById('no-zones-message')!;
const zoneForm = document.getElementById('zone-form')!;
const zoneFormTitle = document.getElementById('zone-form-title')!;
const zoneFormId = document.getElementById('zone-form-id') as HTMLInputElement;
const zoneNameInput = document.getElementById('zone-name') as HTMLInputElement;
const zoneSetCurrentLocationBtn = document.getElementById('zone-set-current-location')!;
const zoneLatInput = document.getElementById('zone-lat') as HTMLInputElement;
const zoneLonInput = document.getElementById('zone-lon') as HTMLInputElement;
const zoneRadiusInput = document.getElementById('zone-radius') as HTMLInputElement;
const zoneBlocklistTextarea = document.getElementById('zone-blocklist') as HTMLTextAreaElement;
const zoneAllowlistTextarea = document.getElementById('zone-allowlist') as HTMLTextAreaElement;
const zoneScheduleEnabledCheckbox = document.getElementById('zone-schedule-enabled') as HTMLInputElement;
const zoneScheduleSettings = document.getElementById('zone-schedule-settings')!;
const zoneStartHourInput = document.getElementById('zone-start-hour') as HTMLInputElement;
const zoneStartMinuteInput = document.getElementById('zone-start-minute') as HTMLInputElement;
const zoneEndHourInput = document.getElementById('zone-end-hour') as HTMLInputElement;
const zoneEndMinuteInput = document.getElementById('zone-end-minute') as HTMLInputElement;
const zoneColorInput = document.getElementById('zone-color') as HTMLInputElement;
const saveZoneBtn = document.getElementById('save-zone')!;
const cancelZoneBtn = document.getElementById('cancel-zone')!;

// Current position elements
const setCurrentPositionBtn = document.getElementById('set-current-position')!;
const currentPositionDisplay = document.getElementById('current-position-display')!;
const manualLatInput = document.getElementById('manual-lat') as HTMLInputElement;
const manualLonInput = document.getElementById('manual-lon') as HTMLInputElement;
const setManualPositionBtn = document.getElementById('set-manual-position')!;
const monitoringEnabledCheckbox = document.getElementById('monitoring-enabled') as HTMLInputElement;
const quickMonitoringToggleBtn = document.getElementById('quick-monitoring-toggle')!;
const snooze10Btn = document.getElementById('snooze-10')!;
const snooze30Btn = document.getElementById('snooze-30')!;
const snooze60Btn = document.getElementById('snooze-60')!;
const disableTodayBtn = document.getElementById('disable-today')!;
const clearSnoozeBtn = document.getElementById('clear-snooze')!;

// Feedback element
const feedbackElement = document.getElementById('feedback')!;

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

async function loadTheme() {
  const settings = await getSettings();
  const isDark = settings.theme !== 'light';
  if (!isDark) {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('light-theme');
    themeToggle.textContent = '🌙';
  }
}

async function toggleTheme() {
  const settings = await getSettings();
  const isDark = settings.theme !== 'light';
  const newTheme = isDark ? 'light' : 'dark';
  await saveSettings({ theme: newTheme });
  await loadTheme();
  setFeedback(`Switched to ${newTheme} theme`, 'info');
}

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
  timerUpdateInterval = setInterval(async () => {
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

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

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

// ============================================
// INITIALIZATION
// ============================================

async function init() {
  console.log('[Nodi] Popup initialized');
  
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
