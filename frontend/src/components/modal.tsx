import { X } from "lucide-react";
import { type ReactNode, useEffect, useId } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  subtitle?: string;
  title: string;
}

function Modal({ children, onClose, subtitle, title }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-40"
      role="dialog"
    >
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 h-full w-full animate-fade-in cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <div className="absolute top-1/2 left-1/2 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 animate-zoom-in overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/60 ring-1 ring-white/5 md:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              className="font-bold text-white text-xl tracking-tight"
              id={titleId}
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
