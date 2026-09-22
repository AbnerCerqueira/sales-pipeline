import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  loading?: boolean;
  variant?: "primary" | "secondary";
}

const VARIANTS = {
  primary:
    "border border-orange-400/20 bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-950/40 hover:from-orange-400 hover:to-orange-600 hover:shadow-orange-950/60 active:from-orange-600 active:to-orange-700",
  secondary:
    "border border-zinc-800 bg-zinc-900 text-zinc-300 shadow-sm shadow-black/20 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-800",
} as const;

function Button({
  className,
  loading = false,
  disabled,
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-sm transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading === true ? <Spinner /> : null}
      {loading === false ? children : null}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      aria-label="Carregando"
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Button;
