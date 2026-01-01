use sqlx::{Row, SqlitePool, Transaction};

/// Migration system that tracks applied migrations and runs them incrementally
pub async fn migrate(pool: &SqlitePool) -> anyhow::Result<(), String> {
    // Create migrations tracking table if it doesn't exist
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    // Run all migrations in order
    run_migration(
        pool,
        1,
        "001_initial_schema",
        include_str!("migrations/001_initial_schema.sql"),
    )
    .await?;
    // Add future migrations here:
    // run_migration(pool, 2, "002_add_supplier_column", include_str!("migrations/002_add_supplier_column.sql")).await?;

    // Seed test data only on fresh installations
    seed_test_data(pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

/// Runs a migration if it hasn't been applied yet
async fn run_migration(
    pool: &SqlitePool,
    version: i64,
    name: &str,
    sql: &str,
) -> anyhow::Result<(), String> {
    // Check if this migration has already been applied
    let applied: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM _migrations WHERE version = ?)")
            .bind(version)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    if !applied {
        let mut tx: Transaction<'_, sqlx::Sqlite> =
            pool.begin().await.map_err(|e| e.to_string())?;

        println!("Running migration {}: {}", version, name);

        // Execute the migration SQL
        sqlx::query(sql)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        // Record that this migration has been applied
        sqlx::query(
            "INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, datetime('now'))",
        )
        .bind(version)
        .bind(name)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        println!("Migration {} completed successfully", version);
    } else {
        println!("Migration {} already applied, skipping", version);
    }

    Ok(())
}
/// Seeds initial test data for development/demo purposes
/// Only runs if database is empty (no materials and no products)
async fn seed_test_data(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let materials_count: i64 = sqlx::query("SELECT COUNT(*) FROM materials")
        .fetch_one(pool)
        .await?
        .get(0);

    let products_count: i64 = sqlx::query("SELECT COUNT(*) FROM products")
        .fetch_one(pool)
        .await?
        .get(0);

    // Only seed if completely empty (fresh installation)
    if materials_count == 0 && products_count == 0 {
        println!("Seeding initial test data...");

        sqlx::query(
            r#"
            INSERT INTO materials (name, category, unit, current_stock, low_stock_alert, created_at) VALUES
            ('橄欖油', '油脂', 'ml', 5000, 1000, datetime('now')),
            ('椰子油', '油脂', 'ml', 3000, 500, datetime('now')),
            ('氫氧化鈉', '鹼', 'g', 2000, 200, datetime('now')),
            ('薰衣草精油', '精油', 'ml', 200, 50, datetime('now'))
            "#
        )
        .execute(pool)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO products (name, category, unit, current_stock, note, created_at) VALUES
            ('薰衣草手工皂', '沐浴', '個', 50, '100g 手工皂', datetime('now')),
            ('橄欖油手工皂', '沐浴', '個', 30, '100g 手工皂', datetime('now')),
            ('蜜糖燕麥皂', '沐浴', '個', 45, '100g 手工皂', datetime('now')),
            ('活性炭皂', '沐浴', '個', 25, '100g 手工皂', datetime('now'))
            "#,
        )
        .execute(pool)
        .await?;

        println!("Test data seeded successfully");
    }

    Ok(())
}
