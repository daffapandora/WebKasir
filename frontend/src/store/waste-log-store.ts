import { create } from 'zustand';
import { getWasteLogs, recordWasteAndDeductStock, getWasteAnalytics } from '@/lib/firebase-service';
import type {
  WasteLog,
  WasteAnalytics,
  CreateWasteLogPayload,
} from '@/types/waste-log';

interface WasteLogState {
  wasteLogs: WasteLog[];
  totalLoss: number;
  analytics: WasteAnalytics | null;
  isLoading: boolean;
  error: string | null;

  fetchWasteLogs: (params?: { from?: string; to?: string; user_id?: number }) => Promise<void>;
  createWasteLog: (payload: CreateWasteLogPayload, userName?: string) => Promise<WasteLog>;
  fetchAnalytics: (params?: { from?: string; to?: string }) => Promise<void>;
}

export const useWasteLogStore = create<WasteLogState>((set) => ({
  wasteLogs: [],
  totalLoss: 0,
  analytics: null,
  isLoading: false,
  error: null,

  fetchWasteLogs: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await getWasteLogs();
      const total = logs.reduce((sum, l) => sum + Number(l.total_loss_amount), 0);
      set({ wasteLogs: logs, totalLoss: total, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createWasteLog: async (payload, userName = 'Admin') => {
    const newLog = await recordWasteAndDeductStock(payload, userName);
    set(s => ({
      wasteLogs: [newLog, ...s.wasteLogs],
      totalLoss: s.totalLoss + Number(newLog.total_loss_amount),
    }));
    return newLog;
  },

  fetchAnalytics: async (params = {}) => {
    const data = await getWasteAnalytics();
    set({ analytics: data });
  },
}));
