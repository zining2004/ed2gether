import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wtrmeiqjqncekcmsenbt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cm1laXFqcW5jZWtjbXNlbmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTA1MDksImV4cCI6MjA2NTYyNjUwOX0.jt4ayQkSXGu8XGZQg9OTfFffE6dOXXu-zWirwLk7itM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
