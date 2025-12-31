use sqlx::{SqlitePool, Transaction};
use tauri::State;

use crate::models::movement::{CreateMovementRequest, Movement};

#[tauri::command]
pub async fn list_movements(pool: State<'_, SqlitePool>) -> Result<Vec<Movement>, String> {
    let rows = sqlx::query_as::<_, Movement>(
        "SELECT 
            il.*,
            COALESCE(m.name, p.name) as item_name,
            COALESCE(m.unit, p.unit) as item_unit,
            COALESCE(m.category, p.category) as item_category
        FROM inventory_logs il
        LEFT JOIN materials m ON il.item_type = 'material' AND il.item_id = m.id
        LEFT JOIN products p ON il.item_type = 'product' AND il.item_id = p.id
        ORDER BY il.created_at DESC",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn add_inventory(
    pool: State<'_, SqlitePool>,
    req: CreateMovementRequest,
) -> Result<(), String> {
    // Fetch the item based on type
    if req.item_type == "material" {
        add_material_inventory(pool, req).await?
    } else {
        add_product_inventory(pool, req).await?
    }

    Ok(())
}

#[tauri::command]
pub async fn add_product_inventory(
    pool: State<'_, SqlitePool>,
    req: CreateMovementRequest,
) -> Result<(), String> {
    let mut tx: Transaction<'_, sqlx::Sqlite> = pool.begin().await.map_err(|e| e.to_string())?;

    // Get current stock before change
    let old_stock: i64 = sqlx::query_scalar("SELECT current_stock FROM products WHERE id = ?")
        .bind(req.item_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // Calculate new stock
    let new_stock = match req.action_type.as_str() {
        "in" => old_stock + req.change_amount as i64,
        "out" => old_stock - req.change_amount as i64,
        "adj" => req.change_amount as i64, // adjustment sets absolute value
        _ => return Err("Invalid action type".to_string()),
    };

    // 1. Record inventory change log
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO inventory_logs (item_id, item_type, action_type, change_amount, old_stock, new_stock, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(req.item_id)
    .bind(&req.item_type)
    .bind(&req.action_type)
    .bind(req.change_amount)
    .bind(old_stock)
    .bind(new_stock)
    .bind(req.note.as_deref())
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // 2. Update product stock
    sqlx::query(
        r#"
        UPDATE products
        SET current_stock = ?
        WHERE id = ?
        "#,
    )
    .bind(new_stock)
    .bind(req.item_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn add_material_inventory(
    pool: State<'_, SqlitePool>,
    req: CreateMovementRequest,
) -> Result<(), String> {
    let mut tx: Transaction<'_, sqlx::Sqlite> = pool.begin().await.map_err(|e| e.to_string())?;

    // Get current stock before change
    let old_stock: f64 = sqlx::query_scalar("SELECT current_stock FROM materials WHERE id = ?")
        .bind(req.item_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // Calculate new stock
    let new_stock = match req.action_type.as_str() {
        "in" => old_stock + req.change_amount,
        "out" => old_stock - req.change_amount,
        "adj" => req.change_amount, // adjustment sets absolute value
        _ => return Err("Invalid action type".to_string()),
    };

    // 1. Record inventory change log
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO inventory_logs (item_id, item_type, action_type, change_amount, old_stock, new_stock, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(req.item_id)
    .bind(&req.item_type)
    .bind(&req.action_type)
    .bind(req.change_amount)
    .bind(old_stock)
    .bind(new_stock)
    .bind(req.note.as_deref())
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // 2. Update material stock
    sqlx::query(
        r#"
        UPDATE materials
        SET current_stock = ?
        WHERE id = ?
        "#,
    )
    .bind(new_stock)
    .bind(req.item_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
