import type { ComponentProps } from "react";

function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500 ${className ?? ""}`}
      {...props}
    />
  );
}

export default Input;
