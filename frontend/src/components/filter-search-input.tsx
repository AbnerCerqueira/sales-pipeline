import { Search, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { cn } from "../lib/utils.ts";
import { Input } from "./ui/input.tsx";

interface FilterSearchInputProps {
  /** Descrição acessível do filtro; deve diferir entre telas. */
  ariaLabel: string;
  className?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Limpa o termo; o pai decide o que hacer com o estado debounced. */
  onClear: () => void;
  placeholder: string;
  value: string;
}

function FilterSearchInput({
  ariaLabel,
  className,
  onChange,
  onClear,
  placeholder,
  value,
}: FilterSearchInputProps) {
  return (
    <div className={cn("relative w-full sm:w-64 lg:w-72", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500"
        size={16}
      />
      <Input
        aria-label={ariaLabel}
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
        onChange={onChange}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value === "" ? null : (
        <button
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-full p-1 text-zinc-400 transition-colors hover:text-zinc-200"
          onClick={onClear}
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export type { FilterSearchInputProps };
export { FilterSearchInput };
