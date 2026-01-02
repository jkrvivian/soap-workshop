use sqlx::SqlitePool;
use tauri::{Manager, State};
use tauri_plugin_dialog::{DialogExt, FilePath};

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
