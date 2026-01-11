-- Safe version: Check and fix sprints column type
-- Run this if the column might already be TEXT[] but needs default value

-- Check current column type
DO $$
DECLARE
    current_type text;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'sprints';
    
    RAISE NOTICE 'Current sprints column type: %', current_type;
    
    -- If it's already an array type, just set the default
    IF current_type = 'ARRAY' THEN
        ALTER TABLE stories ALTER COLUMN sprints SET DEFAULT '{}';
        RAISE NOTICE 'Set default value for existing TEXT[] column';
    -- If it's not an array, we need to convert it
    ELSIF current_type IN ('text', 'character varying', 'varchar') THEN
        -- Add new column
        ALTER TABLE stories ADD COLUMN sprints_new TEXT[] DEFAULT '{}';
        
        -- Migrate data
        UPDATE stories 
        SET sprints_new = CASE 
            WHEN sprints IS NULL OR sprints::text = '' THEN '{}'
            WHEN sprints::text LIKE '{%}' THEN sprints::text::text[]
            ELSE string_to_array(trim(sprints::text), ',')
        END;
        
        -- Drop old column
        ALTER TABLE stories DROP COLUMN sprints;
        
        -- Rename new column
        ALTER TABLE stories RENAME COLUMN sprints_new TO sprints;
        
        RAISE NOTICE 'Converted TEXT/VARCHAR column to TEXT[]';
    ELSE
        RAISE NOTICE 'Column type is: %. Manual intervention may be required.', current_type;
    END IF;
END $$;

