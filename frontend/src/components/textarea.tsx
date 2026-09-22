import type { ComponentProps } from "react";
import { fieldBorder } from "../lib/field-styles.ts";

interface TextareaProps extends ComponentProps<"textarea"> {
  error?: string;
}

function Textarea({ className, error, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 shadow-black/10 shadow-sm outline-none transition-colors duration-150 disabled:opacity-50 ${fieldBorder(error)} ${className ?? ""}`}
      rows={rows}
      {...props}
    />
  );
}

export default Textarea;
