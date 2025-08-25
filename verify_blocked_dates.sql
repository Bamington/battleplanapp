-- Verification script for blocked_dates table
-- Run this in your Supabase SQL editor to check the table structure and policies

-- 1. Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'blocked_dates'
) as table_exists;

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'blocked_dates'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'blocked_dates';

-- 4. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'blocked_dates';

-- 5. Test a simple query (this should work if RLS is set up correctly)
SELECT COUNT(*) as total_blocked_dates FROM blocked_dates;

-- 6. Check for any sample data
SELECT * FROM blocked_dates LIMIT 5;
