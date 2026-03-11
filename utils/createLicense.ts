import { supabase } from './supabaseClient';
import { generateLicenseKey } from './generateLicenseKey';

/**
 * Generates a new license key in the format jilly-android-XXXXX
 * and inserts it into the Supabase `licenses` table.
 *
 * @returns The generated license key string
 * @throws Error if the insert fails
 */
export async function createLicense(): Promise<string> {
  const licenseKey = generateLicenseKey();

  const { error } = await supabase.from('licenses').insert({
    license_key: licenseKey,
    is_active: false,
  });

  if (error) {
    throw new Error(`Failed to create license: ${error.message}`);
  }

  return licenseKey;
}
