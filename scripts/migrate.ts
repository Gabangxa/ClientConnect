#!/usr/bin/env tsx
/**
 * Database Migration Script for CI/CD
 * 
 * This script handles database migrations in production environments.
 * It can be run in CI/CD pipelines to ensure database schema stays in sync.
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { neon } from '@neondatabase/serverless';

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔄 Starting database migrations...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    // Run all pending migrations
    await migrate(db, { migrationsFolder: './migrations' });
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };