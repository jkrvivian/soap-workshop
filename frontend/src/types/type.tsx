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

export const MOVEMENT_ACTIONS = {
  in: {
    key: "in",
    label: "入庫",
  },
  out: {
    key: "out",
    label: "出庫",
  },
  adj: {
    key: "adj",
    label: "校準",
  },
} as const;

export type MovementActionType = keyof typeof MOVEMENT_ACTIONS;
export const MOVEMENT_ACTION_LIST = ["in", "out", "adj"] as const;

export type ViewMode = "list" | "add" | "edit" | "movement";

export const MATERIAL_UNIT_LIST = ["mL", "L", "g", "kg"] as const;
export const PRODUCT_UNIT_LIST = ["個", "盒", "組", "瓶"] as const;
