import { CheckCircle2, X, XCircle } from "lucide-react";
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

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast["type"] = "error") => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        dismiss(id);
      }, 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            className={`pointer-events-auto rounded-lg px-6 py-4 font-medium text-base shadow-lg transition-all ${
              t.type === "error"
                ? "bg-red-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
            key={t.id}
          >
            <span className="flex items-center gap-3">
              {t.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {t.message}
              <button
                aria-label="Fechar"
                className="ml-2 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
                // biome-ignore lint/performance/noJsxPropsBind: needs closure over toast id
                onClick={() => dismiss(t.id)}
                type="button"
              >
                <X size={16} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
