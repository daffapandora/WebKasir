// Ingredient types for TokoPOS frontend

export interface Ingredient {
  id: number;
  name: string;
  sku: string | null;
  category_id: number | null;
  category?: { id: number; name: string } | null;
  supplier_id: number | null;
  supplier?: { id: number; name: string } | null;
  unit: string;
  stock: number;
  min_stock: number;
  cost_price: number;
  avg_cost_price: number;
  expiry_date: string | null;   // ISO date string
  storage_location: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IngredientFormData {
  name: string;
  sku?: string;
  category_id?: number | null;
  supplier_id?: number | null;
  supplier?: { id: number; name: string } | null;
  unit: string;
  stock?: number;
  min_stock?: number;
  cost_price: number;
  expiry_date?: string | null;
  storage_location?: string | null;
  is_active?: boolean;
  notes?: string;
}

export interface StockInData {
  quantity: number;
  unit_cost: number;
  reference?: string;
}

export interface ProductIngredient {
  id: number;
  product_id: number;
  ingredient_id: number;
  quantity_needed: number;
  ingredient: Ingredient;
}

export interface HppBreakdownItem {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  quantity_needed: number;
  unit_cost: number;
  subtotal: number;
}

export interface HppResult {
  product_id: number;
  product_name: string;
  use_recipe: boolean;
  hpp_auto: number;
  cost_price: number;
  effective_hpp: number;
  margin: {
    hpp: number;
    sale_price: number;
    gross_profit: number;
    margin_percent: number;
  };
  breakdown: HppBreakdownItem[];
}
