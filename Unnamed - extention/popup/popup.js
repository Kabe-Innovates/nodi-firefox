(function() {
  const statusText = document.getElementById('status-text');
  const setLocationBtn = document.getElementById('set-location');
  const saveSettingsBtn = document.getElementById('save-settings');
  const radiusInput = document.getElementById('radius');
  const blocklistInput = document.getElementById('blocklist');
  const feedback = document.getElementById('feedback');

  function setStatus(text) { statusText.textContent = text; }
  function setFeedback(text) { feedback.textContent = text; setTimeout(() => feedback.textContent = '', 3000); }

  async function loadSettings() {
    const { zone, radius = 50, blocklist = 'youtube.com, facebook.com, instagram.com', monitoring = false } = await browser.storage.local.get(['zone', 'radius', 'blocklist', 'monitoring']);
    radiusInput.value = radius;
    blocklistInput.value = Array.isArray(blocklist) ? blocklist.join(', ') : (blocklist || '');
    setStatus(monitoring ? 'Monitoring' : 'Idle');
  }

  function parseBlocklist(text) {
    return text
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }

  setLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      setFeedback('Geolocation not supported in this context');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const zone = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      await browser.storage.local.set({ zone });
      setFeedback('Location Saved!');
    }, (err) => {
      console.error('Geolocation error:', err);
      setFeedback('Failed to get location');
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 });
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const radius = Number(radiusInput.value) || 50;
    const blocklist = parseBlocklist(blocklistInput.value);
    await browser.storage.local.set({ radius, blocklist, monitoring: true });
    setStatus('Monitoring');
    setFeedback('Settings saved. Monitoring enabled.');
  });

  // Initialize
  loadSettings();
})();
