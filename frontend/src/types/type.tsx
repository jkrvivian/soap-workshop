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