use sqlx::{SqlitePool, Row};

pub async fn migrate(pool: &SqlitePool) -> anyhow::Result<()> {
    let version: i64 =
        sqlx::query_scalar("PRAGMA user_version")
            .fetch_one(pool)
            .await?;

    if version == 0 {
        sqlx::query(include_str!("schema.sql"))
            .execute(pool)
            .await?;

        sqlx::query("PRAGMA user_version = 1")
            .execute(pool)
            .await?;
    }

    seed_test_data(pool).await.expect("Failed to seed test data");

    Ok(())
}

async fn seed_test_data(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let count: i64 = sqlx::query("SELECT COUNT(*) FROM materials")
        .fetch_one(pool)
        .await?
        .get(0);

    println!("Materials count: {}", count);
    if count > 0 {
        // 已有資料，不再插入
        return Ok(());
    }

    // 插入測試資料
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

    Ok(())
}
