mod commands;
mod db;
mod models;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize database in async context
            let pool = tauri::async_runtime::block_on(async move {
                let pool = db::connection::connect(&app_handle)
                    .await
                    .expect("Failed to connect to database");
                db::migrate::migrate(&pool)
                    .await
                    .expect("Failed to run migrations");
                pool
            });

            app.manage(pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::db_cmd::export_database,
            commands::db_cmd::import_database,
            commands::material_cmd::list_materials,
            commands::material_cmd::add_material,
            commands::material_cmd::update_material,
            commands::material_cmd::remove_material,
            commands::product_cmd::list_products,
            commands::product_cmd::add_product,
            commands::product_cmd::update_product,
            commands::product_cmd::get_product,
            commands::product_cmd::remove_product,
            commands::movement_cmd::list_movements,
            commands::movement_cmd::add_inventory,
            commands::movement_cmd::add_product_inventory,
            commands::movement_cmd::add_material_inventory,
            commands::movement_cmd::list_recent_movements,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
