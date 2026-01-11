-- Fix sprints column type in stories table
-- This script will:
-- 1. Check if the column exists and what type it is
-- 2. Convert existing data to array format if needed
-- 3. Alter the column to TEXT[] type

-- First, let's check the current column type (run this separately to see what we have):
-- SELECT column_name, data_type, udt_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'stories' AND column_name = 'sprints';

-- If the column is TEXT or VARCHAR, we need to:
-- 1. Create a temporary column
-- 2. Migrate data
-- 3. Drop old column
-- 4. Rename new column

-- Step 1: Add temporary column with correct type
ALTER TABLE stories ADD COLUMN sprints_new TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing data (convert any existing values to array format)
-- If sprints column contains comma-separated values, convert them
UPDATE stories 
SET sprints_new = CASE 
    WHEN sprints IS NULL OR sprints = '' THEN '{}'
    WHEN sprints::text LIKE '{%}' THEN sprints::text[]  -- Already in array format
    ELSE string_to_array(sprints::text, ',')  -- Convert comma-separated to array
END
WHERE sprints IS NOT NULL;

-- For rows where sprints is NULL, set to empty array
UPDATE stories 
SET sprints_new = '{}'
WHERE sprints_new IS NULL;

-- Step 3: Drop the old column
ALTER TABLE stories DROP COLUMN sprints;

-- Step 4: Rename the new column
ALTER TABLE stories RENAME COLUMN sprints_new TO sprints;

-- Step 5: Set default value
ALTER TABLE stories ALTER COLUMN sprints SET DEFAULT '{}';

-- Verify the column type
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'stories' AND column_name = 'sprints';

