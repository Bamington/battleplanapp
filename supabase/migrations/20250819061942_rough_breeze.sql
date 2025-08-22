/*
  # Update Game Icons from Bucket Files

  This script finds files in the game-assets bucket that match the pattern:
  [game name] + " " + "icon" + [extension]
  
  And updates the icon field in the games table with the correct URL.
*/

DO $$
DECLARE
    game_record RECORD;
    file_record RECORD;
    icon_url TEXT;
    supabase_url TEXT := 'https://dthxptbozocrbvmhwvao.supabase.co';
    files_found INTEGER := 0;
    games_updated INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting game icon update process...';
    
    -- Loop through each game
    FOR game_record IN 
        SELECT id, name FROM games 
        ORDER BY name
    LOOP
        icon_url := NULL;
        
        -- Try to find matching icon file with different extensions
        -- Pattern: [game name] + " icon" + [extension]
        FOR file_record IN 
            SELECT name, id, updated_at, created_at, last_accessed_at, metadata
            FROM storage.objects 
            WHERE bucket_id = 'game-assets'
            AND (
                name = game_record.name || ' icon.png' OR
                name = game_record.name || ' icon.jpg' OR
                name = game_record.name || ' icon.jpeg' OR
                name = game_record.name || ' Icon.png' OR
                name = game_record.name || ' Icon.jpg' OR
                name = game_record.name || ' Icon.jpeg'
            )
            LIMIT 1
        LOOP
            -- Construct the public URL
            icon_url := supabase_url || '/storage/v1/object/public/game-assets/' || file_record.name;
            files_found := files_found + 1;
            
            RAISE NOTICE 'Found icon for "%": %', game_record.name, file_record.name;
            EXIT; -- Exit the inner loop once we find a match
        END LOOP;
        
        -- Update the game record if we found an icon
        IF icon_url IS NOT NULL THEN
            UPDATE games 
            SET icon = icon_url 
            WHERE id = game_record.id;
            
            games_updated := games_updated + 1;
            RAISE NOTICE 'Updated icon for game "%": %', game_record.name, icon_url;
        ELSE
            RAISE NOTICE 'No icon found for game: %', game_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Icon update complete!';
    RAISE NOTICE 'Files found: %', files_found;
    RAISE NOTICE 'Games updated: %', games_updated;
    
    -- Show final results
    RAISE NOTICE 'Games with icons now: %', (SELECT COUNT(*) FROM games WHERE icon IS NOT NULL);
END $$;