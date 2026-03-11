import { supabase } from './utils/supabaseClient.ts';
import { createLicense } from './utils/createLicense.ts';

async function resetAndCreate() {
  // Reset the existing one
  await supabase.from('licenses').update({ is_active: false, device_id: null, activated_at: null }).eq('license_key', 'jilly-android-A7K9P');
  
  // Create a couple more
  await createLicense();
  await createLicense();
  
  const { data } = await supabase.from('licenses').select('license_key, is_active');
  console.log('Available Licenses:');
  console.table(data);
}

resetAndCreate();
