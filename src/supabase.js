import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iuzyffugeksdulkkvmnh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1enlmZnVnZWtzZHVsa2t2bW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzA3NTgsImV4cCI6MjA3NDk0Njc1OH0.CX_hPHgs4jYLgWw3f95gzm3sgHQDE-hTwDUbXs8QHwA'

export const supabase = createClient(supabaseUrl, supabaseKey)
