import { X } from "lucide-react";
import { type ReactNode, useEffect, useId } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

function Modal({ children, onClose, title }: ModalProps) {
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
        className="absolute inset-0 h-full w-full cursor-default bg-black/70"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <div className="absolute top-1/2 left-1/2 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="font-bold text-2xl text-white tracking-tight"
            id={titleId}
          >
            {title}
          </h2>
          <button
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
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
