use sqlx::{Row, SqlitePool};

pub async fn migrate(pool: &SqlitePool) -> anyhow::Result<()> {
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(pool)
        .await?;

    if version == 0 {
        sqlx::query(include_str!("schema.sql"))
            .execute(pool)
            .await?;

        sqlx::query("PRAGMA user_version = 1").execute(pool).await?;
    }

    seed_test_data(pool)
        .await
        .expect("Failed to seed test data");

    Ok(())
}

async fn seed_test_data(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let materials_count: i64 = sqlx::query("SELECT COUNT(*) FROM materials")
        .fetch_one(pool)
        .await?
        .get(0);

    println!("Materials count: {}", materials_count);
    if materials_count == 0 {
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
    }

    let products_count: i64 = sqlx::query("SELECT COUNT(*) FROM products")
        .fetch_one(pool)
        .await?
        .get(0);

    println!("Products count: {}", products_count);
    if products_count == 0 {
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
    }

    Ok(())
}
