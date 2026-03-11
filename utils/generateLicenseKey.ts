const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PREFIX = 'JILLY-ANDROID-';
const RANDOM_LENGTH = 5;

/**
 * Generates a license key in the format: JILLY-ANDROID-XXXXX
 * where XXXXX is 5 random uppercase letters and digits.
 *
 * @returns A license key string (e.g. "JILLY-ANDROID-A7K9P")
 */
export function generateLicenseKey(): string {
  let suffix = '';
  for (let i = 0; i < RANDOM_LENGTH; i++) {
    const index = Math.floor(Math.random() * CHARACTERS.length);
    suffix += CHARACTERS[index];
  }
  return `${PREFIX}${suffix}`;
}

