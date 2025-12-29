-- Database Schema Inspector SQL
-- Run these queries in your Supabase SQL editor to check for problematic foreign keys

-- 1. Check if box_id column still exists in models table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'models'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all foreign key constraints on models table
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'models'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- 3. Check model_boxes junction table foreign keys
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'model_boxes'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- 4. Check if any models still have box_id values (if column exists)
-- Uncomment this if the box_id column still exists:
-- SELECT COUNT(*) as models_with_box_id
-- FROM models
-- WHERE box_id IS NOT NULL;

-- 5. Check current model-box relationships via junction table
SELECT
    COUNT(*) as total_model_box_relationships,
    COUNT(DISTINCT model_id) as unique_models_in_collections,
    COUNT(DISTINCT box_id) as unique_collections_with_models
FROM model_boxes;

-- 6. Sample of model-box relationships
SELECT
    mb.id,
    m.name as model_name,
    b.name as collection_name,
    mb.added_at
FROM model_boxes mb
JOIN models m ON mb.model_id = m.id
JOIN boxes b ON mb.box_id = b.id
LIMIT 5;