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
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-3">
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
              {t.message}
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 rounded-full p-0.5 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
