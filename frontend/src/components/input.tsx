import type { ComponentProps } from "react";

interface InputProps extends ComponentProps<"input"> {
  counter?: string;
  error?: string;
}

function Input({ className, error, counter, ...props }: InputProps) {
  return (
    <div className="relative">
      <input
        className={`w-full rounded-lg border bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors ${counter ? "pr-14" : ""} ${error ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"} ${className ?? ""}`}
        {...props}
      />
      {counter ? (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-500">
          {counter}
        </span>
      ) : null}
    </div>
  );
}

export default Input;
