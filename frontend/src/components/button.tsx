import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  loading?: boolean;
}

function Button({
  className,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-orange-600 active:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
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
