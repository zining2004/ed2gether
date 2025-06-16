declare module '../utils/supabase' {
    import { SupabaseClient } from '@supabase/supabase-js';
  
    export const supabase: SupabaseClient;
}