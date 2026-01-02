# Database Migration Guide

## Overview

This application uses a versioned migration system to safely update the database schema across different versions. Each migration is tracked and applied only once.

## How It Works

1. **Migration Files**: Located in `src/db/migrations/`, numbered sequentially
2. **Tracking Table**: `_migrations` table stores which migrations have been applied
3. **Automatic Execution**: Migrations run automatically on app startup
4. **Idempotent**: Safe to run multiple times - already-applied migrations are skipped

## Current Migration System

### Migration Table Structure
```sql
CREATE TABLE _migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
);
```

## Adding a New Migration

When you need to update the schema in a new version:

### Step 1: Create a New Migration File

Create a new file in `src/db/migrations/` with the next sequential number:

```bash
touch src/db/migrations/003_add_cost_tracking.sql
```

### Step 2: Write the Migration SQL

Example - Adding a new column:
```sql
-- Migration 003: Add cost tracking to materials
ALTER TABLE materials ADD COLUMN unit_cost REAL DEFAULT 0;
ALTER TABLE materials ADD COLUMN last_purchase_date TEXT;
```

Example - Creating a new table:
```sql
-- Migration 003: Add recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(material_id) REFERENCES materials(id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_product ON recipes(product_id);
```

**Important Guidelines:**
- Use `IF NOT EXISTS` for CREATE statements
- Use `ALTER TABLE ADD COLUMN` with DEFAULT values for new columns
- Never modify existing data destructively without backup
- Test migrations on a copy of your database first

### Step 3: Register the Migration

Edit `src/db/migrate.rs` and add the new migration:

```rust
pub async fn migrate(pool: &SqlitePool) -> anyhow::Result<()> {
    create_migrations_table(pool).await?;

    // Existing migrations
    run_migration(pool, 1, "001_initial_schema", include_str!("migrations/001_initial_schema.sql")).await?;
    
    // Add your new migration here
    run_migration(pool, 3, "003_add_cost_tracking", include_str!("migrations/003_add_cost_tracking.sql")).await?;
    
    seed_test_data(pool).await?;
    Ok(())
}
```

### Step 4: Test the Migration

1. **Test on Fresh Database:**
   ```bash
   # Remove the database to test clean installation
   rm ~/.local/share/com.soap.workshop/soap.db
   cargo tauri dev
   ```

2. **Test on Existing Database:**
   ```bash
   # Keep your existing database
   cargo tauri dev
   # Check logs to confirm migration ran successfully
   ```

## Migration Workflow for Existing Users

When users update to a new version with schema changes:

1. User downloads new version
2. App starts and calls `migrate()` function
3. System checks `_migrations` table for applied migrations
4. Runs only NEW migrations (existing ones are skipped)
5. User's data is preserved, schema is updated

### Example Scenario

**Version 1.0** (User has this):
- Migration 001: Initial schema applied
- Database has user's data

**Version 2.0** (User updates to this):
- Migration 001: ✓ Already applied - SKIP
- Migration 002: ✗ New - RUN
- Migration 003: ✗ New - RUN

Result: User's data preserved, new features available

## Common Migration Patterns

### Adding a Column
```sql
-- Safe: Has default value
ALTER TABLE materials ADD COLUMN supplier_id INTEGER DEFAULT NULL;

-- If you need NOT NULL, use a two-step approach:
ALTER TABLE materials ADD COLUMN supplier_id INTEGER DEFAULT 0;
-- Then update existing records if needed
UPDATE materials SET supplier_id = 1 WHERE supplier_id = 0;
```

### Creating Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
```

### Creating New Tables
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- columns here
);
```

### Renaming Columns (SQLite Limitation)
SQLite doesn't support ALTER COLUMN RENAME directly. You need to:

```sql
-- 1. Create new column
ALTER TABLE materials ADD COLUMN new_name TEXT;

-- 2. Copy data
UPDATE materials SET new_name = old_name;

-- 3. Note: Can't drop old column in SQLite without recreating table
-- Better to just leave old column and document the change
```

## Data Migration Best Practices

1. **Always Backup First**: Use the export feature before major updates
2. **Use Transactions**: Migrations run in transactions by default
3. **Test Locally**: Always test migrations on a copy of production data
4. **Add Defaults**: New columns should have sensible default values
5. **Document Changes**: Add comments in migration files explaining why
6. **Never Delete**: Don't remove old migration files
7. **Keep Order**: Always increment version numbers sequentially

## Rollback Strategy

SQLite doesn't support transaction rollback for schema changes. If a migration fails:

1. The error will be logged
2. The app should not start
3. User should restore from backup
4. Developer should fix the migration and release a patch

To prevent issues:
- Test thoroughly before release
- Provide clear error messages
- Maintain good backup/restore functionality

## Checking Migration Status

You can manually check which migrations have been applied:

```sql
SELECT * FROM _migrations ORDER BY version;
```

Output example:
```
version | name                | applied_at
--------|---------------------|-------------------
1       | 001_initial_schema  | 2026-01-01 10:00:00
2       | 002_add_costs       | 2026-01-15 14:30:00
```

## Import Database and Migrations

When a user imports an old database file:

1. Database file is copied to app data directory
2. App restarts (or user manually restarts)
3. On startup, `migrate()` runs
4. System detects which migrations are missing
5. Applies new migrations to bring database up to current schema

This ensures imported databases are automatically upgraded to the latest schema version.
