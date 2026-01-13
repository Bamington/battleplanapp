/*
  # Standardize Hobby Item Types to Sentence Case

  This migration updates all hobby item types to use sentence case formatting:
  - "paint" or "PAINT" -> "Paint"
  - "other" or "OTHER" -> "Other"

  This ensures consistent counting and display throughout the application.
*/

-- Update all variations of "paint" to "Paint"
UPDATE "public"."hobby_items"
SET "type" = 'Paint'
WHERE LOWER("type") = 'paint';

-- Update all variations of "other" to "Other"
UPDATE "public"."hobby_items"
SET "type" = 'Other'
WHERE LOWER("type") = 'other';
