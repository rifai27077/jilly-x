import { Platform } from 'react-native';

let storage: any = null;

function getStorage() {
  if (!storage) {
    try {
      const { MMKV } = require('react-native-mmkv');
      storage = new MMKV();
    } catch (e) {
      console.warn('MMKV initialization failed, falling back to in-memory storage', e);
      // Fallback in-memory storage
      const memStore: Record<string, string> = {};
      storage = {
        set: (key: string, value: string) => { memStore[key] = value; },
        getString: (key: string) => memStore[key] ?? undefined,
        contains: (key: string) => key in memStore,
        delete: (key: string) => { delete memStore[key]; },
      };
    }
  }
  return storage;
}

const LICENSE_KEY = 'license_key';
const DEVICE_ID_KEY = 'device_id';

export function saveLicenseKey(licenseKey: string): void {
  getStorage().set(LICENSE_KEY, licenseKey);
}

export function getLicenseKey(): string | null {
  const value = getStorage().getString(LICENSE_KEY);
  return value ?? null;
}

export function hasLicenseKey(): boolean {
  return getStorage().contains(LICENSE_KEY);
}

export function removeLicenseKey(): void {
  getStorage().delete(LICENSE_KEY);
}

export function getDeviceId(): string {
  const s = getStorage();
  let deviceId = s.getString(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'device_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    s.set(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
