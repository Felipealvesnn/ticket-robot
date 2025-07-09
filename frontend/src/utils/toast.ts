// ============================================================================
// 🎯 TOAST UTILITIES - React Toastify
// ============================================================================

import { toast as toastify } from "react-toastify";

/**
 * Shortcuts para tipos específicos de toast usando react-toastify
 */
export const toast = {
  success: (message: string, options?: any) =>
    toastify.success(message, options),

  error: (message: string, options?: any) => toastify.error(message, options),

  warning: (message: string, options?: any) =>
    toastify.warning(message, options),

  info: (message: string, options?: any) => toastify.info(message, options),
};
