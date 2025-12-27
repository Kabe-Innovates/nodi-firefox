import { getSettings, saveSettings } from '../common/utils';

/**
 * DOM Elements
 */
const feedback = document.getElementById('feedback') as HTMLDivElement;

/**
 * Show feedback message
 */
function setFeedback(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
  feedback.textContent = text;
  feedback.style.color = type === 'success' ? '#4ade80' : type === 'error' ? '#ef4444' : '#5b9ff5';
  setTimeout(() => {
    feedback.textContent = '';
  }, 3000);
}

/**
 * Theme management
 */
function applyThemeWithSetting(themeSetting: 'system' | 'light' | 'dark'): void {
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const useLight = themeSetting === 'light' || (themeSetting === 'system' && prefersLight);
  document.body.classList.toggle('light-theme', useLight);
}

async function loadTheme(): Promise<void> {
  const settings = await getSettings();
  const themeSetting = settings.theme ?? 'system';
  applyThemeWithSetting(themeSetting);
  if (themeSetting === 'system' && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyThemeWithSetting('system');
    try {
      media.addEventListener('change', handler);
    } catch {
      // Fallback for older browsers
      (media as any).onchange = handler as any;
    }
  }
}

/**
 * Load and display current settings
 */
async function loadOptions(): Promise<void> {
  try {
    const settings = await getSettings();
    
    // Display current settings summary
    const summaryDiv = document.getElementById('settings-summary');
    if (summaryDiv) {
      summaryDiv.innerHTML = `
        <div class="settings-item">
          <strong>Monitoring:</strong> ${settings.monitoring ? 'Enabled' : 'Disabled'}
        </div>
        <div class="settings-item">
          <strong>Zones:</strong> ${settings.zones.length} configured
        </div>
        <div class="settings-item">
          <strong>Timer State:</strong> ${settings.pomodoroTimer.state}
        </div>
        <div class="settings-item">
          <strong>Theme:</strong> ${settings.theme || 'dark'}
        </div>
      `;
    }
    
    console.log('[Nodi Options] Settings loaded:', settings);
  } catch (error) {
    console.error('[Nodi Options] Error loading settings:', error);
    setFeedback('Error loading settings', 'error');
  }
}

/**
 * Export settings to JSON
 */
async function exportSettings(): Promise<void> {
  try {
    const settings = await getSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nodi-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    setFeedback('Settings exported!', 'success');
  } catch (error) {
    console.error('[Nodi Options] Error exporting settings:', error);
    setFeedback('Error exporting settings', 'error');
  }
}

/**
 * Import settings from JSON
 */
async function importSettings(file: File): Promise<void> {
  try {
    const text = await file.text();
    const settings = JSON.parse(text);
    
    // Validate basic structure
    if (!settings.zones || !Array.isArray(settings.zones)) {
      throw new Error('Invalid settings file: missing zones array');
    }
    
    await saveSettings(settings);
    await loadOptions();
    setFeedback('Settings imported successfully!', 'success');
  } catch (error) {
    console.error('[Nodi Options] Error importing settings:', error);
    setFeedback('Error importing settings: Invalid file format', 'error');
  }
}

/**
 * Load theme selection
 */
async function loadThemeSelection(): Promise<void> {
  const settings = await getSettings();
  const theme = settings.theme || 'dark';
  
  const darkRadio = document.getElementById('theme-dark') as HTMLInputElement;
  const lightRadio = document.getElementById('theme-light') as HTMLInputElement;
  const systemRadio = document.getElementById('theme-system') as HTMLInputElement;
  
  if (darkRadio) darkRadio.checked = theme === 'dark';
  if (lightRadio) lightRadio.checked = theme === 'light';
  if (systemRadio) systemRadio.checked = theme === 'system';
}

/**
 * Handle theme change
 */
async function handleThemeChange(theme: 'dark' | 'light' | 'system'): Promise<void> {
  await saveSettings({ theme });
  applyThemeWithSetting(theme);
  setFeedback('Theme updated!', 'success');
  
  // Broadcast theme change to all extension pages (popup, etc.)
  try {
    await browser.runtime.sendMessage({
      type: 'THEME_CHANGED',
      theme
    });
    console.log('[Nodi Options] Theme change broadcast:', theme);
  } catch (error) {
    // Ignore errors if no listeners (popup may be closed)
    console.log('[Nodi Options] No listeners for theme change');
  }
  
  // Update summary
  await loadOptions();
}

/**
 * Reset all settings to default
 */
async function resetSettings(): Promise<void> {
  if (!confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
    return;
  }
  
  try {
    await browser.storage.local.clear();
    await loadOptions();
    setFeedback('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('[Nodi Options] Error resetting settings:', error);
    setFeedback('Error resetting settings', 'error');
  }
}

// Initialize when DOM is ready
function init(): void {
  console.log('[Nodi Options] Initialized');
  
  // Apply theme before rendering to avoid FOUC
  loadTheme()
    .then(() => loadOptions())
    .catch(() => loadOptions());
  
  // Export button
  const exportBtn = document.getElementById('export-settings');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSettings);
  }
  
  // Import button
  const importBtn = document.getElementById('import-settings');
  const importInput = document.getElementById('import-file') as HTMLInputElement;
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importSettings(file);
      }
    });
  }
  
  // Reset button
  const resetBtn = document.getElementById('reset-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSettings);
  }
  
  // Theme selectors
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  themeRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      await handleThemeChange(target.value as 'dark' | 'light' | 'system');
    });
  });
  
  // Load theme selection
  loadThemeSelection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
