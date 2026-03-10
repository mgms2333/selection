import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 选型项类型
export interface SelectionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  specs?: Record<string, unknown>;
  [key: string]: unknown;
}

// 选型状态接口
interface SelectionState {
  // 当前选型列表
  items: SelectionItem[];
  // 当前选型 ID（用于编辑已有选型）
  currentSelectionId: string | null;
  // 选型名称
  selectionName: string;
  // 备注
  remarks: string;
  
  // Actions
  addItem: (item: SelectionItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<SelectionItem>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  reorderItems: (items: SelectionItem[]) => void;
  setSelectionName: (name: string) => void;
  setRemarks: (remarks: string) => void;
  setCurrentSelectionId: (id: string | null) => void;
  clearSelection: () => void;
  loadSelection: (data: {
    items: SelectionItem[];
    selectionName: string;
    remarks: string;
    id: string;
  }) => void;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      items: [],
      currentSelectionId: null,
      selectionName: '',
      remarks: '',

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })),

      reorderItems: (items) => set({ items }),

      setSelectionName: (name) => set({ selectionName: name }),

      setRemarks: (remarks) => set({ remarks }),

      setCurrentSelectionId: (id) => set({ currentSelectionId: id }),

      clearSelection: () =>
        set({
          items: [],
          currentSelectionId: null,
          selectionName: '',
          remarks: '',
        }),

      loadSelection: (data) =>
        set({
          items: data.items,
          selectionName: data.selectionName,
          remarks: data.remarks,
          currentSelectionId: data.id,
        }),
    }),
    {
      name: 'selection-storage',
      partialize: (state) => ({
        items: state.items,
        selectionName: state.selectionName,
        remarks: state.remarks,
      }),
    }
  )
);