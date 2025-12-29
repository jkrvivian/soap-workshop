use sqlx::{SqlitePool, Transaction};
use tauri::State;

use crate::models::material::Material;
use crate::models::requests::InventoryChangeRequest;

#[tauri::command]
pub async fn list_materials(
    pool: State<'_, SqlitePool>
) -> Result<Vec<Material>, String> {
    let rows = sqlx::query_as::<_, Material>(
        "SELECT id, name, category, unit, current_stock, low_stock_alert, note, created_at FROM materials"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn change_inventory(
    pool: State<'_, SqlitePool>,
    req: InventoryChangeRequest,
) -> Result<(), String> {
    let mut tx: Transaction<'_, sqlx::Sqlite> = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. 寫入異動紀錄
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO inventory_logs
        (material_id, change_amount, reason, reference_id, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(req.material_id)
    .bind(req.change_amount)
    .bind(&req.action_type)
    .bind(req.reference_id)
    .bind(req.note.as_deref())
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // 2. 更新目前庫存
    sqlx::query(
        r#"
        UPDATE materials
        SET current_stock = current_stock + ?
        WHERE id = ?
        "#
    )
    .bind(req.change_amount)
    .bind(req.material_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
