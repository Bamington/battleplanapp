-- Migration: Fix official games to have supported=true
-- This migration ensures that official games (those without created_by) are marked as supported

BEGIN;

-- Update all games that don't have a created_by (official games) to be supported
UPDATE games 
SET supported = true 
WHERE created_by IS NULL AND supported IS NOT true;

COMMIT;