import { supabase } from './supabaseClient';

export type ActivationResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Validates and activates a license key.
 * Duration is now controlled by the admin via the `duration_hours` column.
 *
 * - If the key does not exist → returns "invalid license" error
 * - If is_active is true:
 *    - Check if expires_at has passed. If yes → "Expired".
 *    - Check if device_id matches. If not → "Used on another device".
 *    - If still valid and device matches → "License restored successfully."
 * - If is_active is false → activates the key, binds device, computes expires_at.
 */
export async function activateLicense(
  licenseKey: string,
  deviceId: string,
): Promise<ActivationResult> {
  // 1. Look up the license key
  const { data: license, error: fetchError } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey)
    .single();

  if (fetchError || !license) {
    return { success: false, error: 'Invalid license key.' };
  }

  const now = new Date();
  const durationHours = license.duration_hours || 24;
  const durationMs = durationHours * 60 * 60 * 1000;

  // 2. Check if already activated
  if (license.is_active && license.activated_at) {
    // Use expires_at if available, otherwise calculate from activated_at + duration
    let expiresAt: Date;
    if (license.expires_at) {
      expiresAt = new Date(license.expires_at);
    } else {
      expiresAt = new Date(new Date(license.activated_at).getTime() + durationMs);
    }

    // Check expiration
    if (now > expiresAt) {
      return { success: false, error: 'This license has expired. Please contact admin to renew.' };
    }

    // Check device binding
    if (license.device_id !== deviceId) {
      return { success: false, error: 'This license is strictly bound to another device.' };
    }

    // Still valid and correct device - allow them in (e.g. app restart)
    return { success: true, message: 'License restored successfully. Welcome back.' };
  }

  // 3. First time activation for this key
  const expiresAt = new Date(now.getTime() + durationMs);

  const { error: updateError } = await supabase
    .from('licenses')
    .update({
      is_active: true,
      device_id: deviceId,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', license.id);

  if (updateError) {
    return { success: false, error: `Activation failed: ${updateError.message}` };
  }

  return { success: true, message: `License activated successfully for a Lifetime.` };
}
