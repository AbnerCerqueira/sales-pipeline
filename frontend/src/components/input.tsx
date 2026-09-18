import { Eye, EyeOff } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback, useState } from "react";
import { fieldBorder } from "../lib/field-styles.ts";

interface InputProps extends ComponentProps<"input"> {
  counter?: string;
  error?: string;
}

function Input({ className, error, counter, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className="relative">
      <input
        className={`w-full rounded-lg border bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors ${isPassword ? "pr-10" : ""} ${counter ? "pr-14" : ""} ${fieldBorder(error)} ${className ?? ""}`}
        type={inputType}
        {...props}
      />
      {isPassword ? (
        <button
          className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-200"
          onClick={togglePassword}
          tabIndex={-1}
          type="button"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      ) : null}
      {counter ? (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-500">
          {counter}
        </span>
      ) : null}
    </div>
  );
}

export default Input;
