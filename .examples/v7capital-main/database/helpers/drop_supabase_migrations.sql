-- List all tables in supabase_migrations schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'supabase_migrations';

-- Then delete from each table found
DELETE FROM supabase_migrations.schema_migrations;
-- Add DELETE statements for any other tables found