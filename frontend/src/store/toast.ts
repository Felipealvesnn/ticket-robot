import { Toast } from "@/components/ui/Toast";
import { create } from "zustand";

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;

  // Helper methods
  success: (title: string, message?: string, options?: Partial<Toast>) => void;
  error: (title: string, message?: string, options?: Partial<Toast>) => void;
  warning: (title: string, message?: string, options?: Partial<Toast>) => void;
  info: (title: string, message?: string, options?: Partial<Toast>) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },

  // Helper methods para facilitar o uso
  success: (title, message, options = {}) => {
    get().addToast({
      type: "success",
      title,
      message,
      ...options,
    });
  },

  error: (title, message, options = {}) => {
    get().addToast({
      type: "error",
      title,
      message,
      duration: 7000, // Erros ficam mais tempo
      ...options,
    });
  },

  warning: (title, message, options = {}) => {
    get().addToast({
      type: "warning",
      title,
      message,
      ...options,
    });
  },

  info: (title, message, options = {}) => {
    get().addToast({
      type: "info",
      title,
      message,
      ...options,
    });
  },
}));
