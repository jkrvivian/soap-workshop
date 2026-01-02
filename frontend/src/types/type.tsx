export interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  low_stock_alert: number | null;
  note: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  note: string | null;
  created_at: string;
}

export interface Movement {
  id: number;
  item_id: number;
  item_name: string;
  item_type: "material" | "product";
  item_unit: string;
  change_amount: number;
  action_type: "in" | "out" | "adj";
  related_batch: string | null;
  note: string | null;
  created_at: string;
}
