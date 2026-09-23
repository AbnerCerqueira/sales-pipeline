import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

type ToastType = "error" | "success";

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

export function useToast(): ToastContextValue {
  const toast = useCallback((message: string, type: ToastType = "error") => {
    if (type === "success") {
      sonnerToast.success(message);
    } else {
      sonnerToast.error(message);
    }
  }, []);

  return { toast };
}
