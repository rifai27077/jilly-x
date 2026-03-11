const LICENSE_KEY = 'license_key';
const DEVICE_ID_KEY = 'device_id';

/**
 * Web-specific storage adapter using localStorage.
 * React Native's bundler automatically uses this file for Web builds.
 */

export function saveLicenseKey(licenseKey: string): void {
  try {
    localStorage.setItem(LICENSE_KEY, licenseKey);
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function getLicenseKey(): string | null {
  try {
    return localStorage.getItem(LICENSE_KEY);
  } catch (e) {
    return null;
  }
}

export function hasLicenseKey(): boolean {
  try {
    return localStorage.getItem(LICENSE_KEY) !== null;
  } catch (e) {
    return false;
  }
}

export function removeLicenseKey(): void {
  try {
    localStorage.removeItem(LICENSE_KEY);
  } catch (e) {
    console.error('Failed to remove from localStorage', e);
  }
}

/**
 * Retrieves a stable device identifier.
 * Generates and stores one if it doesn't exist.
 */
export function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'web_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (e) {
    // Fallback if localStorage is entirely blocked
    return 'web_fallback_' + Date.now().toString(36);
  }
}
