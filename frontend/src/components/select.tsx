import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { fieldBorder } from "../lib/field-styles.ts";

interface SelectProps extends ComponentProps<"select"> {
  error?: string;
}

function Select({ className, error, value, ...props }: SelectProps) {
  const isEmpty = value === "" || value === undefined;

  return (
    <div className="relative">
      <select
        className={`w-full appearance-none rounded-lg border bg-zinc-800 px-4 py-2.5 pr-10 text-sm outline-none transition-colors ${
          isEmpty ? "text-zinc-500" : "text-zinc-100"
        } ${fieldBorder(error)} ${className ?? ""}`}
        value={value}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400"
        size={18}
      />
    </div>
  );
}

export default Select;
