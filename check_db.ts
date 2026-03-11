import { supabase } from './utils/supabaseClient.ts';

async function check() {
  const { data, error } = await supabase.from('licenses').select('*');
  console.log('Licenses in DB:', data);
  console.log('Error:', error);
}

check();
