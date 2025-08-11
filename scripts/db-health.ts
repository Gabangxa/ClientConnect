#!/usr/bin/env tsx
/**
 * Database Health Check & Performance Analysis
 * 
 * This script analyzes database performance and suggests optimizations.
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';

const checkDatabaseHealth = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sqlClient = neon(process.env.DATABASE_URL);
  const db = drizzle(sqlClient);

  console.log('🔍 Starting database health check...\n');

  try {
    // Check table sizes
    console.log('📊 Table Sizes:');
    const tableSizes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);
    
    tableSizes.rows.forEach((row: any) => {
      console.log(`  ${row.tablename}: ${row.size}`);
    });

    // Check index usage
    console.log('\n📈 Index Usage:');
    const indexUsage = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;
    `);

    indexUsage.rows.forEach((row: any) => {
      console.log(`  ${row.tablename}.${row.indexname}: ${row.scans} scans`);
    });

    // Check slow queries (if pg_stat_statements is enabled)
    console.log('\n🐌 Query Performance:');
    try {
      const slowQueries = await db.execute(sql`
        SELECT 
          substring(query, 1, 100) as query_preview,
          calls,
          total_exec_time,
          mean_exec_time,
          rows
        FROM pg_stat_statements 
        WHERE calls > 10
        ORDER BY mean_exec_time DESC 
        LIMIT 5;
      `);
      
      if (slowQueries.rows.length > 0) {
        slowQueries.rows.forEach((row: any) => {
          console.log(`  Query: ${row.query_preview}...`);
          console.log(`    Calls: ${row.calls}, Avg Time: ${row.mean_exec_time}ms`);
        });
      } else {
        console.log('  pg_stat_statements not available or no slow queries found');
      }
    } catch (error) {
      console.log('  pg_stat_statements extension not enabled');
    }

    // Check database connections
    console.log('\n🔗 Connection Stats:');
    const connections = await db.execute(sql`
      SELECT 
        state,
        count(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state;
    `);

    connections.rows.forEach((row: any) => {
      console.log(`  ${row.state || 'null'}: ${row.count} connections`);
    });

    console.log('\n✅ Database health check completed');

  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabaseHealth();
}

export { checkDatabaseHealth };