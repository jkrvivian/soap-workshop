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
