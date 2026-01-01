-- Migration 002: Example future migration
-- Uncomment and modify when you need to add new schema changes
-- 
-- Example: Add a new column to materials table
-- ALTER TABLE materials ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id);
--
-- Example: Create a new table
-- CREATE TABLE IF NOT EXISTS material_suppliers (
--     material_id INTEGER NOT NULL,
--     supplier_id INTEGER NOT NULL,
--     PRIMARY KEY (material_id, supplier_id),
--     FOREIGN KEY(material_id) REFERENCES materials(id),
--     FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
-- );
--
-- Example: Create an index
-- CREATE INDEX IF NOT EXISTS idx_materials_supplier ON materials(supplier_id);

-- Example: Remove column
-- PRAGMA foreign_keys=OFF;

-- CREATE TABLE materials_new (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     name TEXT NOT NULL,
--     category TEXT,
--     unit TEXT NOT NULL,
--     current_stock REAL NOT NULL DEFAULT 0,
--     low_stock_alert REAL,
--     created_at TEXT NOT NULL
-- );

-- INSERT INTO materials_new (id, name, category, unit, current_stock, low_stock_alert, created_at)
-- SELECT id, name, category, unit, current_stock, low_stock_alert, created_at
-- FROM materials;

-- DROP TABLE materials;
-- ALTER TABLE materials_new RENAME TO materials;

-- CREATE INDEX IF NOT EXISTS idx_inventory_logs_item ON inventory_logs(item_type, item_id);
-- PRAGMA foreign_keys=ON;

-- Example: Drop table or index
DROP TABLE IF EXISTS old_table;
DROP INDEX IF EXISTS idx_old_table_some_index;