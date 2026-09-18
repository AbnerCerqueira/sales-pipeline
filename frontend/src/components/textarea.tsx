import type { ComponentProps } from "react";
import { fieldBorder } from "../lib/field-styles.ts";

interface TextareaProps extends ComponentProps<"textarea"> {
  error?: string;
}

function Textarea({ className, error, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full resize-y rounded-lg border bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors ${fieldBorder(error)} ${className ?? ""}`}
      rows={rows}
      {...props}
    />
  );
}

export default Textarea;
