import type { LeadDTO } from "@sales/shared";
import { CheckIcon, ChevronDownIcon, Loader2Icon } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useErrorToast } from "../hooks/use-error-toast.ts";
import { useLeadsQuery } from "../hooks/use-leads.ts";
import { cn } from "../lib/utils.ts";
import { Button } from "./ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover.tsx";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 50;

interface LeadComboboxProps
  extends Omit<
    React.ComponentProps<"button">,
    "onChange" | "onSelect" | "value"
  > {
  /** Label when nothing is selected. */
  emptyLabel: string;
  onSelect?: (lead: LeadDTO) => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** Controlled value; empty string means none. */
  value: string;
}

function LeadCombobox({
  className,
  emptyLabel,
  onValueChange,
  onSelect,
  placeholder,
  value,
  ...buttonProps
}: LeadComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadDTO | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const leadsQuery = useLeadsQuery({
    name: debouncedSearch || undefined,
    page: 1,
    pageSize: SEARCH_PAGE_SIZE,
  });
  useErrorToast(leadsQuery);

  const leads = leadsQuery.data?.items;
  const isSearching =
    leadsQuery.isPending || leadsQuery.isFetching || search !== debouncedSearch;

  useEffect(() => {
    if (!value) {
      setSelectedLead(null);
      return;
    }

    const match = leads?.find((lead) => lead.id === value);
    if (match) {
      setSelectedLead(match);
    }
  }, [leads, value]);

  function handleSelect(lead: LeadDTO) {
    onValueChange(lead.id);
    setSelectedLead(lead);
    onSelect?.(lead);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  }

  const triggerLabel = selectedLead ? selectedLead.fullName : emptyLabel;

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, []);

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          {...buttonProps}
          className={cn(
            "h-9 w-full justify-between border border-input bg-transparent px-2.5 font-normal text-sm hover:bg-transparent aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/30",
            className
          )}
          data-slot="lead-combobox-trigger"
          type="button"
          variant="outline"
        >
          <span
            className={cn("truncate", !selectedLead && "text-muted-foreground")}
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
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder={placeholder}
            value={search}
          />
          <CommandList>
            <CommandEmpty>
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <Loader2Icon className="size-4 animate-spin" />
                  {search ? "Buscando leads..." : "Carregando leads..."}
                </span>
              ) : (
                "Nenhum lead encontrado."
              )}
            </CommandEmpty>
            <CommandGroup>
              {leads?.map((lead) => (
                <CommandItem
                  key={lead.id}
                  // biome-ignore lint/performance/noJsxPropsBind: cmdk onSelect needs the target lead
                  onSelect={() => handleSelect(lead)}
                  value={lead.id}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{lead.fullName}</span>
                    <span className="truncate text-muted-foreground text-xs">
                      {lead.companyName}
                    </span>
                  </span>
                  {lead.id === value ? (
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

export type { LeadComboboxProps };
export { LeadCombobox };
