import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bfsnirnbzufkknlrmovw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc25pcm5ienVma2tubHJtb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzQ5NjAsImV4cCI6MjA4ODgxMDk2MH0.b2K5E2ZjKB4QaF_1F_1X-kiPUOAFv3ODP8E_vIGCHWM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
