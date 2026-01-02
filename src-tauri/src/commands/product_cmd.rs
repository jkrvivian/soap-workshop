use sqlx::SqlitePool;
use tauri::State;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};

use crate::models::product::{
    CreateProductRequest, Product, RemoveProductRequest, UpdateProductRequest,
};

#[tauri::command]
pub async fn list_products(pool: State<'_, SqlitePool>) -> Result<Vec<Product>, String> {
    let rows = sqlx::query_as::<_, Product>(
        "SELECT id, name, category, unit, current_stock, note, created_at, deleted_at 
         FROM products 
         WHERE deleted_at IS NULL",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn add_product(
    pool: State<'_, SqlitePool>,
    product: CreateProductRequest,
) -> Result<(), String> {
    let created_at = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO products (name, category, unit, current_stock, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&product.name)
    .bind(&product.category)
    .bind(&product.unit)
    .bind(0)
    .bind(&product.note)
    .bind(&created_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_product(
    pool: State<'_, SqlitePool>,
    id: i64,
    req: UpdateProductRequest,
) -> Result<(), String> {
    println!("Updating product id {}: {:?}", id, req);

    sqlx::query(
        r#"
        UPDATE products
        SET name = ?, category = ?, note = ?
        WHERE id = ?
        "#,
    )
    .bind(&req.name)
    .bind(&req.category)
    .bind(&req.note)
    .bind(id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_product(pool: State<'_, SqlitePool>, id: i64) -> Result<Product, String> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT id, name, category, unit, current_stock, note, created_at, deleted_at 
         FROM products 
         WHERE id = ? AND deleted_at IS NULL",
    )
    .bind(id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(product)
}

#[tauri::command]
pub async fn remove_product(
    app: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
    product: RemoveProductRequest,
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
        UPDATE products
        SET deleted_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&deleted_at)
    .bind(&product.id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
