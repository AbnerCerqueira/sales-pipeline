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
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            className="pointer-events-auto flex animate-slide-up items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/95 px-4 py-3 shadow-black/40 shadow-xl ring-1 ring-white/5 backdrop-blur-sm"
            key={t.id}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="shrink-0 text-emerald-400" size={18} />
            ) : (
              <XCircle className="shrink-0 text-red-400" size={18} />
            )}
            <p className="min-w-0 flex-1 font-medium text-sm text-zinc-200">
              {t.message}
            </p>
            <button
              aria-label="Fechar"
              className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              // biome-ignore lint/performance/noJsxPropsBind: needs closure over toast id
              onClick={() => dismiss(t.id)}
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
