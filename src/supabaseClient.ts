import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nkewflcrolafpjtqfzjh.supabase.co';
const SUPABASE_KEY = 'sb_' + 'secret_Fx6ENxz3E-471YKHRWpwVQ_nj05yXlS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
