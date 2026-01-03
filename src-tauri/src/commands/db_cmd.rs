use chrono::DateTime;
use rust_xlsxwriter::{ExcelDateTime, Format, Workbook};
use sqlx::SqlitePool;
use tauri::{Manager, State};
use tauri_plugin_dialog::{DialogExt, FilePath};

use crate::models::material::Material;
use crate::models::movement::Movement;
use crate::models::product::Product;

#[tauri::command]
pub async fn export_database(
    app: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let backup_path = app
        .dialog()
        .file()
        .add_filter("Database", &["db"])
        .set_file_name(&format!(
            "soap-backup_{}.db",
            chrono::Utc::now().format("%Y%m%d_%H%M%S")
        ))
        .blocking_save_file();

    let backup_path = match backup_path {
        Some(FilePath::Path(p)) => p,
        _ => return Err("No file path selected".to_string()),
    };

    // Use VACUUM INTO to create a clean backup copy
    let sql = format!("VACUUM INTO '{}'", backup_path.display());
    sqlx::query(&sql)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    app.dialog()
        .message(format!("{} 資料庫匯出成功!", backup_path.display()))
        .title("匯出成功")
        .blocking_show();

    Ok(backup_path.display().to_string())
}

#[tauri::command]
pub async fn import_database(
    app: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let import_path = app
        .dialog()
        .file()
        .add_filter("Database", &["db"])
        .blocking_pick_file();

    let import_path = match import_path {
        Some(FilePath::Path(p)) => p,
        _ => return Err("No file path selected".to_string()),
    };

    pool.close().await;

    // Get the app database path
    let mut db_path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    db_path.push("soap.db");

    // Copy the imported file to the app database location
    std::fs::copy(&import_path, &db_path).map_err(|e| format!("Failed to copy database: {}", e))?;

    app.dialog()
        .message(format!(
            "{} 資料庫匯入成功,\n 應用程式將在按下 OK 後重新啟動",
            import_path.display()
        ))
        .title("匯入成功")
        .blocking_show();

    app.restart();
}

#[tauri::command]
pub async fn export_database_excel(
    app: tauri::AppHandle,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let export_file = app
        .dialog()
        .file()
        .add_filter("Excel", &["xlsx"])
        .set_file_name(&format!(
            "soap-export_{}.xlsx",
            chrono::Utc::now().format("%Y%m%d_%H%M%S")
        ))
        .blocking_save_file();

    let export_path = match export_file {
        Some(FilePath::Path(p)) => p.display().to_string(),
        _ => return Err("No file path selected".to_string()),
    };

    let mut workbook = Workbook::new();

    // Export Materials sheet
    export_materials_excel(&mut workbook, &pool).await?;

    // Export Products sheet
    export_products_excel(&mut workbook, &pool).await?;

    // Export Movements sheet
    export_movements_excel(&mut workbook, &pool).await?;

    workbook
        .save(&export_path)
        .map_err(|e| format!("Failed to close Excel file: {}", e))?;

    app.dialog()
        .message(format!("資料庫已成功匯出至 Excel 檔案！\n{}", export_path))
        .title("匯出成功")
        .blocking_show();

    Ok(export_path)
}

async fn export_materials_excel(workbook: &mut Workbook, pool: &SqlitePool) -> Result<(), String> {
    let materials: Vec<Material> = sqlx::query_as("SELECT * FROM materials")
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to fetch materials: {}", e))?;

    let worksheet = workbook
        .add_worksheet()
        .set_name("Material")
        .map_err(|e| format!("Failed to create Materials sheet: {}", e))?;

    let header_format = Format::new().set_bold();
    let datetime_format = Format::new().set_num_format("yyyy-mm-dd hh:mm:ss");

    let headers = vec![
        "ID",
        "名稱",
        "分類",
        "單位",
        "目前庫存",
        "低庫存警告",
        "備註",
        "建立時間",
        "刪除時間",
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header: {}", e))?;
    }

    for (row, material) in materials.iter().enumerate() {
        let row = (row + 1) as u32;
        worksheet
            .write_number(row, 0, material.id as f64)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 1, &material.name)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 2, &material.category)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 3, &material.unit)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_number(row, 4, material.current_stock)
            .map_err(|e| format!("Failed to write cell: {}", e))?;

        if let Some(alert) = material.low_stock_alert {
            worksheet
                .write_number(row, 5, alert)
                .map_err(|e| format!("Failed to write cell: {}", e))?;
        }

        worksheet
            .write_string(row, 6, &material.note.clone().unwrap_or_default())
            .map_err(|e| format!("Failed to write cell: {}", e))?;

        // Parse and write created_at as datetime
        if let Ok(dt) = DateTime::parse_from_rfc3339(&material.created_at) {
            if let Ok(created_time) = ExcelDateTime::from_timestamp(dt.timestamp()) {
                worksheet
                    .write_datetime_with_format(row, 7, created_time, &datetime_format)
                    .map_err(|e| format!("Failed to write cell: {}", e))?;
            };
        } else {
            worksheet
                .write_string(row, 7, &material.created_at)
                .map_err(|e| format!("Failed to write cell: {}", e))?;
        }

        // Write deleted_at as datetime if exists
        if let Some(deleted) = &material.deleted_at {
            if let Ok(dt) = DateTime::parse_from_rfc3339(deleted) {
                if let Ok(excel_dt) = ExcelDateTime::from_timestamp(dt.timestamp()) {
                    worksheet
                        .write_datetime_with_format(row, 8, excel_dt, &datetime_format)
                        .map_err(|e| format!("Failed to write cell: {}", e))?;
                };
            } else {
                worksheet
                    .write_string(row, 8, deleted)
                    .map_err(|e| format!("Failed to write cell: {}", e))?;
            }
        }
    }

    worksheet
        .set_column_width(1, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(2, 10)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(5, 10)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(7, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(8, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;

    Ok(())
}

async fn export_products_excel(workbook: &mut Workbook, pool: &SqlitePool) -> Result<(), String> {
    let products: Vec<Product> = sqlx::query_as("SELECT * FROM products")
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to fetch products: {}", e))?;

    let worksheet = workbook
        .add_worksheet()
        .set_name("Products")
        .map_err(|e| format!("Failed to create Products sheet: {}", e))?;

    let header_format = Format::new().set_bold();
    let datetime_format = Format::new().set_num_format("yyyy-mm-dd hh:mm:ss");

    let headers = vec![
        "ID",
        "名稱",
        "分類",
        "單位",
        "目前庫存",
        "備註",
        "建立時間",
        "刪除時間",
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header: {}", e))?;
    }

    for (row, product) in products.iter().enumerate() {
        let row = (row + 1) as u32;
        worksheet
            .write_number(row, 0, product.id as f64)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 1, &product.name)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 2, &product.category)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 3, &product.unit)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_number(row, 4, product.current_stock as f64)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 5, &product.note.clone().unwrap_or_default())
            .map_err(|e| format!("Failed to write cell: {}", e))?;

        // Write created_at as datetime
        if let Ok(dt) = DateTime::parse_from_rfc3339(&product.created_at) {
            if let Ok(created_time) = ExcelDateTime::from_timestamp(dt.timestamp()) {
                worksheet
                    .write_datetime_with_format(row, 6, created_time, &datetime_format)
                    .map_err(|e| format!("Failed to write cell: {}", e))?;
            };
        } else {
            worksheet
                .write_string(row, 6, &product.created_at)
                .map_err(|e| format!("Failed to write cell: {}", e))?;
        }

        // Write deleted_at as datetime if exists
        if let Some(deleted) = &product.deleted_at {
            if let Ok(dt) = DateTime::parse_from_rfc3339(deleted) {
                if let Ok(deleted_time) = ExcelDateTime::from_timestamp(dt.timestamp()) {
                    worksheet
                        .write_datetime(row, 7, deleted_time)
                        .map_err(|e| format!("Failed to write cell: {}", e))?;
                };
            } else {
                worksheet
                    .write_string(row, 7, deleted)
                    .map_err(|e| format!("Failed to write cell: {}", e))?;
            }
        }
    }

    worksheet
        .set_column_width(1, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(2, 10)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(6, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(7, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;

    Ok(())
}

async fn export_movements_excel(workbook: &mut Workbook, pool: &SqlitePool) -> Result<(), String> {
    let movements: Vec<Movement> = sqlx::query_as(
        "
        SELECT 
            il.*,
            COALESCE(m.name, p.name) as item_name,
            COALESCE(m.unit, p.unit) as item_unit,
            COALESCE(m.category, p.category) as item_category
        FROM inventory_logs il
        LEFT JOIN materials m ON il.item_type = 'material' AND il.item_id = m.id
        LEFT JOIN products p ON il.item_type = 'product' AND il.item_id = p.id",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch movements: {}", e))?;

    let worksheet = workbook
        .add_worksheet()
        .set_name("Movements")
        .map_err(|e| format!("Failed to create Movements sheet: {}", e))?;

    let header_format = Format::new().set_bold();
    let datetime_format = Format::new().set_num_format("yyyy-mm-dd hh:mm:ss");

    let headers = vec![
        "ID",
        "項目ID",
        "項目類型",
        "項目名稱",
        "項目單位",
        "變更數量",
        "舊庫存",
        "新庫存",
        "操作類型",
        "備註",
        "建立時間",
    ];

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header: {}", e))?;
    }

    for (row, movement) in movements.iter().enumerate() {
        let row = (row + 1) as u32;
        worksheet
            .write_number(row, 0, movement.id as f64)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_number(row, 1, movement.item_id as f64)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 2, &movement.item_type)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 3, &movement.item_name)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 4, &movement.item_unit)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_number(row, 5, movement.change_amount)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_number(row, 6, movement.old_stock)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_number(row, 7, movement.new_stock)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 8, &movement.action_type)
            .map_err(|e| format!("Failed to write cell: {}", e))?;
        worksheet
            .write_string(row, 9, &movement.note.clone().unwrap_or_default())
            .map_err(|e| format!("Failed to write cell: {}", e))?;

        // Write created_at as datetime
        if let Ok(dt) = DateTime::parse_from_rfc3339(&movement.created_at) {
            if let Ok(created_time) = ExcelDateTime::from_timestamp(dt.timestamp()) {
                worksheet
                    .write_datetime_with_format(row, 10, created_time, &datetime_format)
                    .map_err(|e| format!("Failed to write cell: {}", e))?;
            };
        } else {
            worksheet
                .write_string(row, 10, &movement.created_at)
                .map_err(|e| format!("Failed to write cell: {}", e))?;
        }
    }

    worksheet
        .set_column_width(3, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(9, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;
    worksheet
        .set_column_width(10, 20)
        .map_err(|e| format!("Failed to set column 1 width {e}"))?;

    Ok(())
}
