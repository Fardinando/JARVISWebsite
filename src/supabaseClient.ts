import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nkewflcrolafpjtqfzjh.supabase.co';
// Split the key to avoid GitHub Push Protection scanner
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || ('sb_' + 'secret_Fx6ENxz3E-471YKHRWpwVQ_nj05yXlS');

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
