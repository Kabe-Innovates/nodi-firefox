// Focus Shield Background Service Worker (Firefox MV3)

function toRad(deg) { return (deg * Math.PI) / 180; }
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getSettings() {
  const { zone, radius = 50, blocklist = [], monitoring = false } = await browser.storage.local.get(['zone', 'radius', 'blocklist', 'monitoring']);
  return { zone, radius, blocklist, monitoring };
}

function domainMatches(url, blocklist) {
  try {
    const u = new URL(url);
    const host = u.host.replace(/^www\./, '').toLowerCase();
    return blocklist.some(domain => {
      domain = domain.toLowerCase().trim();
      return host === domain || host.endsWith('.' + domain);
    });
  } catch (_) { return false; }
}

function getCurrentPositionOrNull() {
  return new Promise((resolve) => {
    try {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        _err => resolve(null),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 1500 }
      );
    } catch (_) { resolve(null); }
  });
}

browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    try {
      const { zone, radius, blocklist, monitoring } = await getSettings();
      if (!monitoring || !zone || !radius || !Array.isArray(blocklist) || blocklist.length === 0) return {};
      if (!domainMatches(details.url, blocklist)) return {};

      let current = await getCurrentPositionOrNull();
      if (!current) {
        const { currentPosition } = await browser.storage.local.get('currentPosition');
        current = currentPosition || null;
      }
      if (!current) return {};

      const distance = haversine(current.lat, current.lon, zone.lat, zone.lon);
      if (distance <= radius) {
        console.log(`Blocked ${details.url} - Inside Productivity Zone`);
        return { cancel: true };
      }
    } catch (e) {
      console.warn('webRequest error:', e);
    }
    return {};
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);
