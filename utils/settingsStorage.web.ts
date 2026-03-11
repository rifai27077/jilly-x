const SETTINGS_KEY = 'jillyx_settings';

export function saveSettings(settings: Record<string, any>): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadSettings(): Record<string, any> | null {
  try {
    const value = localStorage.getItem(SETTINGS_KEY);
    if (!value) return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}
