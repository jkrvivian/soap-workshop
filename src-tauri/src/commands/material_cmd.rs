use sqlx::{SqlitePool, Transaction};
use tauri::State;

use crate::models::material::Material;
use crate::models::requests::{
    CreateMaterialRequest, MaterialInventoryChangeRequest, UpdateMaterialRequest,
};

#[tauri::command]
pub async fn list_materials(pool: State<'_, SqlitePool>) -> Result<Vec<Material>, String> {
    let rows = sqlx::query_as::<_, Material>(
        "SELECT id, name, category, unit, current_stock, low_stock_alert, note, created_at FROM materials"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn add_material(
    pool: State<'_, SqlitePool>,
    material: CreateMaterialRequest,
) -> Result<(), String> {
    let created_at = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO materials
        (name, category, unit, current_stock, low_stock_alert, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&material.name)
    .bind(&material.category)
    .bind(&material.unit)
    .bind(material.current_stock)
    .bind(material.low_stock_alert)
    .bind(&material.note)
    .bind(&created_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_material(
    pool: State<'_, SqlitePool>,
    id: i64,
    req: UpdateMaterialRequest,
) -> Result<(), String> {
    println!("Updating material id {}: {:?}", id, req);

    if let Ok(material) = get_material(&*pool, id).await {
        if material.unit != req.unit {
            return Err("不能更改已有材料的单位".to_string());
        }
    } else {
        return Err(format!("查無原料 id {}", id));
    }

    sqlx::query(
        r#"
        UPDATE materials
        SET name = ?, category = ?, unit = ?, low_stock_alert = ?, note = ?
        WHERE id = ?
        "#,
    )
    .bind(&req.name)
    .bind(&req.category)
    .bind(&req.unit)
    .bind(req.low_stock_alert)
    .bind(&req.note)
    .bind(id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_material_inventory(
    pool: State<'_, SqlitePool>,
    req: MaterialInventoryChangeRequest,
) -> Result<(), String> {
    let mut tx: Transaction<'_, sqlx::Sqlite> = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Record inventory change log
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO material_inventory_logs
        (material_id, change_amount, reason, reference_id, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
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

    // 2. Update material stock
    sqlx::query(
        r#"
        UPDATE materials
        SET current_stock = current_stock + ?
        WHERE id = ?
        "#,
    )
    .bind(req.change_amount)
    .bind(req.material_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

async fn get_material(pool: &SqlitePool, id: i64) -> Result<Material, String> {
    let material = sqlx::query_as::<_, Material>(
        "SELECT id, name, category, unit, current_stock, low_stock_alert, note, created_at 
         FROM materials 
         WHERE id = ?",
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(material)
}
