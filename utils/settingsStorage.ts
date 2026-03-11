const SETTINGS_KEY = 'jillyx_settings';

let storage: any = null;

function getStorage() {
  if (!storage) {
    try {
      const { MMKV } = require('react-native-mmkv');
      storage = new MMKV();
    } catch (e) {
      console.warn('MMKV initialization failed in settingsStorage, using in-memory fallback', e);
      const memStore: Record<string, string> = {};
      storage = {
        set: (key: string, value: string) => { memStore[key] = value; },
        getString: (key: string) => memStore[key] ?? undefined,
      };
    }
  }
  return storage;
}

export function saveSettings(settings: Record<string, any>): void {
  try {
    getStorage().set(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}

export function loadSettings(): Record<string, any> | null {
  try {
    const value = getStorage().getString(SETTINGS_KEY);
    if (!value) return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}
