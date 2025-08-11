#!/bin/bash

# Database Deployment Script for CI/CD
# This script ensures safe database deployments with rollback capabilities

set -e  # Exit on any error

# Configuration
BACKUP_RETENTION_DAYS=30
MIGRATION_TIMEOUT=300  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_env() {
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "$ENVIRONMENT" ]; then
        log_warn "ENVIRONMENT not set, defaulting to 'development'"
        export ENVIRONMENT="development"
    fi
}

# Create database backup before migration
create_backup() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    log_info "Creating database backup: $backup_name"
    
    # For PostgreSQL - adjust for your database type
    if command -v pg_dump &> /dev/null; then
        pg_dump "$DATABASE_URL" > "backups/${backup_name}.sql"
        log_info "Backup created successfully"
    else
        log_warn "pg_dump not available, skipping backup"
    fi
}

# Run database health check
health_check() {
    log_info "Running database health check..."
    npx tsx scripts/db-health.ts
    
    if [ $? -eq 0 ]; then
        log_info "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
}

# Generate and apply migrations
run_migrations() {
    log_info "Generating migration files..."
    npx drizzle-kit generate
    
    log_info "Applying database migrations..."
    timeout $MIGRATION_TIMEOUT npx tsx scripts/migrate.ts
    
    if [ $? -eq 0 ]; then
        log_info "Migrations applied successfully"
    else
        log_error "Migration failed or timed out"
        exit 1
    fi
}

# Verify migration results
verify_migration() {
    log_info "Verifying migration results..."
    npx drizzle-kit check
    
    if [ $? -eq 0 ]; then
        log_info "Migration verification passed"
    else
        log_error "Migration verification failed"
        exit 1
    fi
}

# Clean up old backups
cleanup_backups() {
    if [ -d "backups" ]; then
        log_info "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."
        find backups -name "backup_*.sql" -mtime +$BACKUP_RETENTION_DAYS -delete
    fi
}

# Main deployment function
deploy() {
    log_info "Starting database deployment for environment: $ENVIRONMENT"
    
    # Create backup directory
    mkdir -p backups
    
    # Pre-deployment steps
    check_env
    health_check
    
    # Create backup only in production
    if [ "$ENVIRONMENT" = "production" ]; then
        create_backup
    fi
    
    # Run migrations
    run_migrations
    
    # Post-deployment verification
    verify_migration
    health_check
    
    # Cleanup
    cleanup_backups
    
    log_info "Database deployment completed successfully!"
}

# Execute deployment
deploy