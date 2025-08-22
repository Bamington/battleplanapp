/*
  # Update Blood Bowl game with image assets

  1. Updates
    - Updates the Blood Bowl game record to include image and icon paths
    - Sets the image field to point to the Blood Bowl.png file
    - Sets the icon field to point to the Blood Bowl Icon.png file

  2. Notes
    - Uses the public folder paths for the uploaded assets
    - Only updates if a Blood Bowl game exists in the database
*/

DO $$
BEGIN
  -- Update Blood Bowl game with image assets if it exists
  UPDATE games 
  SET 
    image = '/Blood Bowl.png',
    icon = '/Blood Bowl Icon.png'
  WHERE LOWER(name) LIKE '%blood bowl%';
  
  -- If no Blood Bowl game exists, create one
  IF NOT EXISTS (SELECT 1 FROM games WHERE LOWER(name) LIKE '%blood bowl%') THEN
    INSERT INTO games (name, image, icon)
    VALUES ('Blood Bowl', '/Blood Bowl.png', '/Blood Bowl Icon.png');
  END IF;
END $$;