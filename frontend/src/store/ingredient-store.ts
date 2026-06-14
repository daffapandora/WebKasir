import { create } from 'zustand';
import { getIngredients, addIngredient, updateIngredient, deleteIngredient, stockInIngredient, getIngredientUsageLogs } from '@/lib/firebase-service';
import type { Ingredient, IngredientFormData, StockInData } from '@/types/ingredient';

interface IngredientState {
  ingredients: Ingredient[];
  usageLogs: any[];
  isLoading: boolean;
  error: string | null;

  fetchIngredients: (params?: { low_stock?: boolean; supplier_id?: number }) => Promise<void>;
  createIngredient: (data: IngredientFormData) => Promise<Ingredient>;
  updateIngredient: (id: number, data: Partial<IngredientFormData>) => Promise<Ingredient>;
  deleteIngredient: (id: number) => Promise<void>;
  stockIn: (id: number, data: StockInData) => Promise<void>;
  fetchUsageLogs: () => Promise<void>;
}

export const useIngredientStore = create<IngredientState>((set, get) => ({
  ingredients: [],
  usageLogs: [],
  isLoading: false,
  error: null,

  fetchIngredients: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      let list = await getIngredients();
      if (params.low_stock) {
        list = list.filter(i => i.stock <= i.min_stock);
      }
      if (params.supplier_id) {
        list = list.filter(i => i.supplier_id === params.supplier_id);
      }
      set({ ingredients: list, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createIngredient: async (data) => {
    const payload: any = {
      name: data.name,
      sku: data.sku || null,
      category_id: data.category_id || null,
      supplier_id: data.supplier_id || null,
      unit: data.unit,
      stock: data.stock || 0,
      min_stock: data.min_stock || 0,
      cost_price: data.cost_price,
      expiry_date: data.expiry_date || null,
      storage_location: data.storage_location || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };
    const newIng = await addIngredient(payload);
    set(s => ({ ingredients: [newIng, ...s.ingredients] }));
    return newIng;
  },

  updateIngredient: async (id, data) => {
    await updateIngredient(id, data as Partial<Ingredient>);
    set(s => ({
      ingredients: s.ingredients.map(i => i.id === id ? { ...i, ...data } : i),
    }));
    // Get updated object to return it
    const updated = get().ingredients.find(i => i.id === id);
    if (!updated) throw new Error("Ingredient not found after update");
    return updated;
  },

  deleteIngredient: async (id) => {
    await deleteIngredient(id);
    set(s => ({ ingredients: s.ingredients.filter(i => i.id !== id) }));
  },

  stockIn: async (id, data) => {
    await stockInIngredient(id, data.quantity, data.unit_cost, data.reference);
    // Refetch all ingredients to ensure average cost and stock are updated and in sync
    const list = await getIngredients();
    set({ ingredients: list });
  },

  fetchUsageLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const logs = await getIngredientUsageLogs();
      set({ usageLogs: logs, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
