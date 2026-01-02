use sqlx::SqlitePool;
use tauri::State;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};

use crate::models::material::{
    CreateMaterialRequest, Material, RemoveMaterialRequest, UpdateMaterialRequest,
};

#[tauri::command]
pub async fn list_materials(pool: State<'_, SqlitePool>) -> Result<Vec<Material>, String> {
    let rows = sqlx::query_as::<_, Material>(
        "SELECT id, name, category, unit, current_stock, low_stock_alert, note, created_at, deleted_at 
         FROM materials 
         WHERE deleted_at IS NULL"
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
pub async fn remove_material(
    app: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
    material: RemoveMaterialRequest,
) -> Result<(), String> {
    let answer = app
        .dialog()
        .message("確定要刪除這個產品嗎？")
        .title("確認刪除")
        .buttons(MessageDialogButtons::OkCancel)
        .blocking_show();

    if !answer {
        return Ok(());
    }

    let deleted_at = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        UPDATE materials
        SET deleted_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&deleted_at)
    .bind(&material.id)
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
            return Err("不能更改已有材料的單位".to_string());
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

async fn get_material(pool: &SqlitePool, id: i64) -> Result<Material, String> {
    let material = sqlx::query_as::<_, Material>(
        "SELECT id, name, category, unit, current_stock, low_stock_alert, note, created_at, deleted_at 
         FROM materials 
         WHERE id = ? AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(material)
}
