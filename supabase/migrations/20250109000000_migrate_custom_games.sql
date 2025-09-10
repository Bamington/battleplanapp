-- Migration: Convert custom_game fields to proper game entries
-- This migration will:
-- 1. Create game entries for all unique custom_game values
-- 2. Update models and boxes to reference the new game entries
-- 3. Clean up by setting custom_game fields to NULL

BEGIN;

-- Step 1: Create games for unique custom_game values from models table
INSERT INTO games (name, created_by, supported, created_at, updated_at)
SELECT DISTINCT 
    m.custom_game as name,
    m.user_id as created_by,
    false as supported,
    NOW() as created_at,
    NOW() as updated_at
FROM models m 
WHERE m.custom_game IS NOT NULL 
    AND m.custom_game != ''
    AND NOT EXISTS (
        -- Avoid duplicates if a game with same name already exists for this user
        SELECT 1 FROM games g 
        WHERE g.name = m.custom_game 
            AND g.created_by = m.user_id
    );

-- Step 2: Create games for unique custom_game values from boxes table
INSERT INTO games (name, created_by, supported, created_at, updated_at)
SELECT DISTINCT 
    b.custom_game as name,
    b.user_id as created_by,
    false as supported,
    NOW() as created_at,
    NOW() as updated_at
FROM boxes b 
WHERE b.custom_game IS NOT NULL 
    AND b.custom_game != ''
    AND NOT EXISTS (
        -- Avoid duplicates from models step and existing games
        SELECT 1 FROM games g 
        WHERE g.name = b.custom_game 
            AND g.created_by = b.user_id
    );

-- Step 3: Update models to reference the new game entries
UPDATE models 
SET game_id = (
    SELECT g.id 
    FROM games g 
    WHERE g.name = models.custom_game 
        AND g.created_by = models.user_id
    LIMIT 1
)
WHERE custom_game IS NOT NULL 
    AND custom_game != '';

-- Step 4: Update boxes to reference the new game entries  
UPDATE boxes 
SET game_id = (
    SELECT g.id 
    FROM games g 
    WHERE g.name = boxes.custom_game 
        AND g.created_by = boxes.user_id
    LIMIT 1
)
WHERE custom_game IS NOT NULL 
    AND custom_game != '';

-- Step 5: Set custom_game fields to NULL (we'll remove these columns later)
UPDATE models SET custom_game = NULL WHERE custom_game IS NOT NULL;
UPDATE boxes SET custom_game = NULL WHERE custom_game IS NOT NULL;

-- Create indexes for better performance on the new filtering queries
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_supported ON games(supported);
CREATE INDEX IF NOT EXISTS idx_games_created_by_supported ON games(created_by, supported);

COMMIT;