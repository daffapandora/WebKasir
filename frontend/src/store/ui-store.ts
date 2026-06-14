/* ═══════════════════════════════════════════════════
   UI Store — Zustand
   Global UI state: theme, toast, sidebar, modals
   ═══════════════════════════════════════════════════ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Toast, ToastType } from '@/types';
import { generateId } from '@/lib/utils';

interface UIStore {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (name: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Admin PIN Modal
  pinModalOpen: boolean;
  pinCallback: ((success: boolean) => void) | null;
  requestAdminPin: (callback: (success: boolean) => void) => void;
  closePinModal: () => void;

  // Branch selector
  selectedBranchId: number | null;
  setSelectedBranch: (id: number | null) => void;

  // Date range filter
  dateRange: { from: string; to: string };
  setDateRange: (from: string, to: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => {
        set(state => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
          }
          return { theme: newTheme };
        });
      },

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      // Toasts
      toasts: [],
      addToast: (type: ToastType, title: string, message?: string, duration = 4000) => {
        const id = generateId();
        const toast: Toast = { id, type, title, message, duration };
        set(state => ({ toasts: [...state.toasts, toast] }));

        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      removeToast: (id: string) => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
      },

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (name: string, data?: Record<string, unknown>) => {
        set({ activeModal: name, modalData: data || null });
      },
      closeModal: () => {
        set({ activeModal: null, modalData: null });
      },

      // Admin PIN
      pinModalOpen: false,
      pinCallback: null,
      requestAdminPin: (callback: (success: boolean) => void) => {
        set({ pinModalOpen: true, pinCallback: callback });
      },
      closePinModal: () => {
        const { pinCallback } = get();
        if (pinCallback) pinCallback(false);
        set({ pinModalOpen: false, pinCallback: null });
      },

      // Branch selector
      selectedBranchId: null,
      setSelectedBranch: (id: number | null) => set({ selectedBranchId: id }),

      // Date range
      dateRange: {
        from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      setDateRange: (from: string, to: string) => set({ dateRange: { from, to } }),
    }),
    {
      name: 'pos-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        selectedBranchId: state.selectedBranchId,
      }),
    }
  )
);
