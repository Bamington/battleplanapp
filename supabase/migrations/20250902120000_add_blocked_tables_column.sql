-- Add blocked_tables column to blocked_dates table
-- This allows partial blocking of tables instead of blocking entire date

-- Add blocked_tables column (default to null for backwards compatibility)
ALTER TABLE blocked_dates ADD COLUMN blocked_tables integer;

-- Add constraint to ensure blocked_tables is positive when specified
ALTER TABLE blocked_dates ADD CONSTRAINT blocked_tables_positive CHECK (blocked_tables > 0 OR blocked_tables IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN blocked_dates.blocked_tables IS 'Number of tables to block. If NULL, blocks all tables (legacy behavior)';