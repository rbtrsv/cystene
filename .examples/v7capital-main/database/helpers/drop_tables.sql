DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all ENUM types
    FOR r IN (SELECT typname FROM pg_type t
              JOIN pg_namespace n ON t.typnamespace = n.oid
              WHERE n.nspname = 'public' AND t.typtype = 'e') 
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;
