// ============================================================================
// 🎯 TOAST UTILITIES
// ============================================================================

import { ToastType } from "@/components/ui/Toast";

/**
 * Dispara um toast global através de evento customizado
 */
export const showToast = (
  type: ToastType,
  title: string,
  message?: string,
  options?: {
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
) => {
  const event = new CustomEvent("showToast", {
    detail: {
      type,
      title,
      message,
      ...options,
    },
  });

  window.dispatchEvent(event);
};

/**
 * Shortcuts para tipos específicos de toast
 */
export const toast = {
  success: (title: string, message?: string, options?: any) =>
    showToast("success", title, message, options),

  error: (title: string, message?: string, options?: any) =>
    showToast("error", title, message, { duration: 7000, ...options }),

  warning: (title: string, message?: string, options?: any) =>
    showToast("warning", title, message, options),

  info: (title: string, message?: string, options?: any) =>
    showToast("info", title, message, options),
};
