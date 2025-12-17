import { getSettings, saveSettings, parseBlocklist } from '../common/utils';

/**
 * DOM Elements
 */
const radiusInput = document.getElementById('radius') as HTMLInputElement;
const blocklistInput = document.getElementById('blocklist') as HTMLTextAreaElement;
const monitoringToggle = document.getElementById('monitoring-toggle') as HTMLInputElement;
const saveBtn = document.getElementById('save-options') as HTMLButtonElement;
const feedback = document.getElementById('feedback') as HTMLDivElement;

/**
 * Show feedback message
 */
function setFeedback(text: string): void {
  feedback.textContent = text;
  setTimeout(() => {
    feedback.textContent = '';
  }, 3000);
}

/**
 * Load options
 */
async function loadOptions(): Promise<void> {
  const settings = await getSettings();
  // Options page is deprecated - just log
  console.log('[Nodi] Settings:', settings);
}

/**
 * Save options
 */
saveBtn.addEventListener('click', async () => {
  const radius = Number(radiusInput.value) || 50;
  const blocklist = parseBlocklist(blocklistInput.value);
  const monitoring = monitoringToggle.checked;

  if (blocklist.length === 0 && monitoring) {
    setFeedback('⚠ Add domains before enabling monitoring');
    return;
  }

  await saveSettings({ radius, blocklist, monitoring });
  setFeedback('✓ Options saved');
});

// Initialize
loadOptions();
