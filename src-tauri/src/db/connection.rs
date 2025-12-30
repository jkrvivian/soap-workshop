use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tauri::Manager;

pub async fn connect(app: &tauri::AppHandle) -> anyhow::Result<SqlitePool> {
    // Use project db directory
    let mut path = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");

    std::fs::create_dir_all(&path)?;
    path.push("soap.db");

    println!("Database path: {}", path.display());

    let url = format!("sqlite://{}?mode=rwc", path.to_string_lossy());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await?;

    Ok(pool)
}
