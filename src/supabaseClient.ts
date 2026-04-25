import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nkewflcrolafpjtqfzjh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Mk4vTzvtHa76tUfzjferag_fhi1KxXa';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
