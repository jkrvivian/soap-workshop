use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: i64,
    pub name: String,
    pub category: String,
    pub unit: String,
    pub current_stock: i64,
    pub note: Option<String>,
    pub created_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub category: String,
    pub unit: String,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateProductRequest {
    pub name: String,
    pub category: String,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RemoveProductRequest {
    pub id: i64,
}
