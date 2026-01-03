use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Movement {
    pub id: i64,
    pub item_id: i64,
    pub item_name: String,
    pub item_type: String,
    pub item_unit: String,
    pub change_amount: f64,
    pub old_stock: f64,
    pub new_stock: f64,
    pub action_type: String,
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateMovementRequest {
    pub item_type: String,
    pub item_id: i64,
    pub action_type: String,
    pub change_amount: f64,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct InventoryLog {
    pub id: i64,
    pub item_id: i64,
    pub item_type: String,
    pub change_amount: f64,
    pub old_stock: f64,
    pub new_stock: f64,
    pub action_type: String,
    pub note: Option<String>,
    pub created_at: String,
}
