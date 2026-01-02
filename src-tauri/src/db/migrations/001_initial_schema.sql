-- Migration 001: Initial schema
CREATE TABLE materials (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    category        TEXT,
    unit            TEXT NOT NULL,         -- g, ml, pcs
    current_stock   REAL NOT NULL DEFAULT 0,
    low_stock_alert REAL,                   -- 低於多少提醒
    note            TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE suppliers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    contact     TEXT,
    phone       TEXT,
    email       TEXT,
    note        TEXT
);

CREATE TABLE inventory_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type       TEXT NOT NULL,         -- 'material' or 'product'
    item_id         INTEGER NOT NULL,      -- material_id or product_id
    change_amount   REAL NOT NULL,         -- positive or negative
    old_stock       REAL NOT NULL,         -- stock before change
    new_stock       REAL NOT NULL,         -- stock after change
    action_type     TEXT NOT NULL,         -- 'purchase', 'production', 'sale', 'adjust'
    note            TEXT,
    created_at      TEXT NOT NULL
);

CREATE INDEX idx_inventory_logs_item ON inventory_logs(item_type, item_id);
CREATE INDEX idx_inventory_logs_created ON inventory_logs(created_at DESC);

CREATE TABLE products (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    category        TEXT,
    sku             TEXT,
    unit            TEXT NOT NULL,
    current_stock   INTEGER NOT NULL DEFAULT 0,
    note            TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE production_batches (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER NOT NULL,
    quantity      INTEGER NOT NULL,
    produced_at   TEXT NOT NULL,
    note          TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE customers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    phone       TEXT,
    email       TEXT,
    note        TEXT
);

CREATE TABLE sales_orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id  INTEGER,
    order_date   TEXT NOT NULL,
    total_amount REAL,
    note         TEXT,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE sales_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity   INTEGER NOT NULL,
    price      REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES sales_orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);


CREATE TABLE app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
