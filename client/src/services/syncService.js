// Sync service to cache live data locally and track sync timestamps

const STORAGE_KEY_PREFIX = 'sahibhav_cache_';
const LAST_SYNC_KEY = 'sahibhav_last_sync';

export function saveSyncedData(state, records, total) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      state,
      total,
      records
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${state}`, JSON.stringify(payload));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return true;
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
    return false;
  }
}

export function getCachedStateData(state) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${state}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getLastSyncTime() {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function getRelativeTimeString(isoString, lang = 'hi') {
  if (!isoString) return lang === 'hi' ? 'सिंक नहीं हुआ' : 'Not synced';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return lang === 'hi' ? 'अभी-अभी सिंक हुआ' : 'Synced just now';
  }
  if (diffMinutes < 60) {
    return lang === 'hi' ? `${diffMinutes} मिनट पहले सिंक` : `Synced ${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  return lang === 'hi' ? `${diffHours} घंटे पहले सिंक` : `Synced ${diffHours}h ago`;
}

export function saveUserPreference(key, value) {
  try {
    localStorage.setItem(`sahibhav_pref_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save preference ${key}:`, e);
  }
}

export function getUserPreference(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(`sahibhav_pref_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}
