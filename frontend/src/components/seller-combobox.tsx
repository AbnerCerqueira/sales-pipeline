import type { SellerDTO } from "@sales/shared";
import { CheckIcon, ChevronDownIcon, Loader2Icon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { cn } from "../lib/utils.ts";
import { Button } from "./ui/button.tsx";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover.tsx";

interface SellerComboboxProps
  extends Omit<React.ComponentProps<"button">, "onChange" | "value"> {
  /** Label when nothing is selected (or "all" is selected). */
  emptyLabel: string;
  /** Falha na query de vendedores — não confundir com lista vazia. */
  isError?: boolean;
  isPending?: boolean;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** Prefix for the selected seller name in the trigger. */
  selectedPrefix?: string;
  sellers: SellerDTO[] | undefined;
  /** When set, shows a first option that clears the selection. */
  showAllLabel?: string;
  /** Controlled value; empty string means none/all. */
  value: string;
}

function SellerCombobox({
  className,
  emptyLabel,
  isError = false,
  isPending = false,
  onValueChange,
  placeholder,
  selectedPrefix = "",
  sellers,
  showAllLabel,
  value,
  ...buttonProps
}: SellerComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = sellers?.find((seller) => seller.id === value);
  const triggerLabel = selected
    ? `${selectedPrefix}${selected.name}`
    : emptyLabel;
  // `showAllLabel` sempre injeta um CommandItem, então o CommandEmpty do cmdk
  // nunca renderiza: loading, erro e lista vazia ficam fora dele.
  const isListPending = isPending || sellers === undefined;

  function handleSelect(sellerId: string) {
    onValueChange(sellerId);
    setOpen(false);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          {...buttonProps}
          className={cn(
            "h-9 w-full justify-between border border-input bg-transparent px-2.5 font-normal text-sm hover:bg-transparent aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/30",
            className
          )}
          data-slot="seller-combobox-trigger"
          type="button"
          variant="outline"
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {triggerLabel}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            {isListPending ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm">
                <Loader2Icon aria-hidden className="size-4 animate-spin" />
                Carregando vendedores...
              </div>
            ) : null}
            {isError ? (
              <div className="py-6 text-center text-destructive text-sm">
                Erro ao carregar os vendedores.
              </div>
            ) : null}
            {!(isListPending || isError) && sellers.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Nenhum vendedor encontrado.
              </div>
            ) : null}
            <CommandGroup>
              {showAllLabel ? (
                <CommandItem
                  // biome-ignore lint/performance/noJsxPropsBind: cmdk onSelect needs the target id; stable enough for a short list
                  onSelect={() => handleSelect("")}
                  value={showAllLabel}
                >
                  {showAllLabel}
                  {value === "" ? (
                    <CheckIcon className="ml-auto size-4" />
                  ) : null}
                </CommandItem>
              ) : null}
              {sellers?.map((seller) => (
                <CommandItem
                  key={seller.id}
                  // biome-ignore lint/performance/noJsxPropsBind: cmdk onSelect needs the target id; stable enough for a short list
                  onSelect={() => handleSelect(seller.id)}
                  value={seller.name}
                >
                  {seller.name}
                  {seller.id === value ? (
                    <CheckIcon className="ml-auto size-4" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export type { SellerComboboxProps };
export { SellerCombobox };
