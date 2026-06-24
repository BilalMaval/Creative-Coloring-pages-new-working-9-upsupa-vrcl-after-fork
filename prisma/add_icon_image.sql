-- Add icon_image column to categories table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='categories' AND column_name='icon_image') THEN
        ALTER TABLE categories ADD COLUMN icon_image TEXT;
    END IF;
END $$;
