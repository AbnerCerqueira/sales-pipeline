import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

interface Toast {
  id: number;
  message: string;
  type: "error" | "success";
}

interface ToastContextValue {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const toast = useCallback(
    (message: string, type: Toast["type"] = "error") => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            className={`pointer-events-auto rounded-lg px-4 py-3 font-medium text-sm shadow-lg transition-all ${
              t.type === "error"
                ? "bg-red-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
            key={t.id}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
