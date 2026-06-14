// Waste Log types for TokoPOS frontend

export type WasteReason = 'expired' | 'spoiled' | 'unsold' | 'production_error' | 'other';
export type WastedType  = 'ingredient' | 'product';

export interface WasteLogItem {
  id: number;
  waste_log_id: number;
  wasted_type: string;   // "App\\Models\\Ingredient" | "App\\Models\\Product"
  wasted_id: number;
  item_name: string;
  unit: string;
  quantity: number;
  cost_at_time: number;
  total_cost: number;
  reason: WasteReason;
  reason_detail: string | null;
  created_at: string;
}

export interface WasteLog {
  id: number;
  user_id: number;
  user_name: string;
  user?: { id: number; name: string; role: string };
  total_loss_amount: number;
  logged_at: string;
  notes: string | null;
  items?: WasteLogItem[];
  created_at: string;
}

// ─ Input types for form submission ─

export interface WasteLogItemInput {
  wasted_type: WastedType;
  wasted_id: number;
  quantity: number;
  reason: WasteReason | string;
  reason_detail?: string;
}

export interface CreateWasteLogPayload {
  logged_at: string;
  notes?: string;
  items: WasteLogItemInput[];
}

// ─ Analytics ─

export interface WasteByReason {
  reason: WasteReason;
  count: number;
  total_cost: number;
}

export interface WasteTopItem {
  item_name: string;
  wasted_type: string;
  total_qty: number;
  total_cost: number;
}

export interface WasteAnalytics {
  period: { from: string; to: string };
  total_loss: number;
  by_reason: WasteByReason[];
  top_items: WasteTopItem[];
}
