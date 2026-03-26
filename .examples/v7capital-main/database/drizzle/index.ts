import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as accountsSchema from './models/accounts';
import * as companiesSchema from './models/companies';
import * as portfolioSchema from './models/portfolio';
import * as captableSchema from './models/captable';
import * as schemaConstants from './schema-constants';

// Load all schemas
const schema = { 
  ...accountsSchema, 
  ...companiesSchema, 
  ...portfolioSchema, 
  ...captableSchema,
  ...schemaConstants 
};

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Initialize PostgreSQL pool with SSL enabled for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });

// Export all schema entities
export * from './models/accounts';
export * from './models/companies';
export * from './models/portfolio';
export * from './models/captable';
export * from './schema-constants';
