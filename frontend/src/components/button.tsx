import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  loading?: boolean;
  variant?: "primary" | "secondary";
}

const VARIANTS = {
  primary: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700",
  secondary:
    "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:bg-zinc-600",
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
      className={`flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ""}`}
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
