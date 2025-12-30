use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct MaterialInventoryChangeRequest {
    pub material_id: i64,
    pub change_amount: f64, // Changed from i64 to f64 to match schema REAL type
    pub action_type: String, // Maps to 'reason' in inventory_logs
    pub reference_id: Option<i64>, // Changed from String to Option<i64> to match schema
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
