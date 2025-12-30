mod db;
mod models;
mod commands;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Initialize database in async context
            let pool = tauri::async_runtime::block_on(async move {
                let pool = db::connection::connect(&app_handle).await
                    .expect("Failed to connect to database");
                db::migrate::migrate(&pool).await
                    .expect("Failed to run migrations");
                pool
            });
            
            app.manage(pool);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::material_cmd::list_materials,
            commands::material_cmd::update_material_inventory,
            commands::material_cmd::add_material,
            commands::material_cmd::update_material,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
