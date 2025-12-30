use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Material {
    pub id: i64,
    pub name: String,
    pub category: String,
    pub unit: String,
    pub current_stock: f64,
    pub low_stock_alert: Option<f64>,
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MaterialInventoryChangeRequest {
    pub material_id: i64,
    pub change_amount: f64, // Changed from i64 to f64 to match schema REAL type
    pub action_type: String, // Maps to 'reason' in inventory_logs
    pub note: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateMaterialRequest {
    pub name: String,
    pub category: Option<String>,
    pub unit: String,
    pub current_stock: f64,
    pub low_stock_alert: Option<f64>,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateMaterialRequest {
    pub name: String,
    pub category: Option<String>,
    pub unit: String,
    pub low_stock_alert: Option<f64>,
    pub note: Option<String>,
}
