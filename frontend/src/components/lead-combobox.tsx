import type { LeadDTO, LeadSummary } from "@sales/shared";
import { CheckIcon, ChevronDownIcon, Loader2Icon } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useErrorToast } from "../hooks/use-error-toast.ts";
import { useLeadsQuery } from "../hooks/use-leads.ts";
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

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 50;

interface LeadComboboxProps
  extends Omit<
    React.ComponentProps<"button">,
    "onChange" | "onSelect" | "value"
  > {
  /** Label when nothing is selected. */
  emptyLabel: string;
  /** Lead already on screen (deep link): resolves the label without a query. */
  leadHint?: LeadSummary | null;
  onSelect?: (lead: LeadDTO) => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  selectedPrefix?: string;
  showAllLabel?: string;
  /** Controlled value; empty string means none. */
  value: string;
}

/**
 * Rótulo do trigger. `value` sem lead resolvido (ex.: `leadId` de um deal que
 * saiu do board) não pode cair em "Todos": mentiria com o filtro ativo.
 */
function triggerLabel(
  lead: LeadSummary | null,
  value: string,
  emptyLabel: string,
  selectedPrefix: string
): string {
  if (value === "") {
    return emptyLabel;
  }
  return `${selectedPrefix}${lead?.fullName ?? "—"}`;
}

function triggerTitle(
  lead: LeadSummary | null,
  value: string
): string | undefined {
  return value !== "" && !lead
    ? "Lead sem negócios no filtro atual"
    : undefined;
}

function LeadCombobox({
  className,
  emptyLabel,
  leadHint,
  onValueChange,
  onSelect,
  placeholder,
  selectedPrefix = "",
  showAllLabel,
  value,
  ...buttonProps
}: LeadComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadSummary | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const leadsQuery = useLeadsQuery(
    {
      name: debouncedSearch || undefined,
      page: 1,
      pageSize: SEARCH_PAGE_SIZE,
    },
    open
  );
  useErrorToast(leadsQuery);

  const leads = leadsQuery.data?.items;
  const isSearching =
    leadsQuery.isPending || leadsQuery.isFetching || search !== debouncedSearch;

  // `value` chega de fora (deep link/back-forward): o label sai da lista do
  // popover (só roda com o aberto) ou do hint do DTO, nunca de uma query só
  // pra resolver o nome. O cache (`selectedLead`) só vale se ainda for o
  // lead da URL — sem esse guard, voltar para um leadId sem label na tela
  // mostraria o lead anterior.
  const popoverMatch = leads?.find((lead) => lead.id === value);
  const hintMatch = leadHint?.id === value ? leadHint : undefined;
  const triggerLead =
    popoverMatch ??
    hintMatch ??
    (selectedLead?.id === value ? selectedLead : null);

  useEffect(() => {
    if (!value) {
      setSelectedLead(null);
      return;
    }

    const match = popoverMatch ?? hintMatch;
    if (match) {
      setSelectedLead(match);
    }
  }, [hintMatch, popoverMatch, value]);

  function handleSelect(lead: LeadDTO) {
    onValueChange(lead.id);
    setSelectedLead(lead);
    onSelect?.(lead);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  }

  const handleClear = useCallback(() => {
    onValueChange("");
    setSelectedLead(null);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  }, [onValueChange]);

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
          title={triggerTitle(triggerLead, value)}
          type="button"
          variant="outline"
        >
          <span
            className={cn("truncate", !triggerLead && "text-muted-foreground")}
          >
            {triggerLabel(triggerLead, value, emptyLabel, selectedPrefix)}
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
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                {search ? "Buscando leads..." : "Carregando leads..."}
              </div>
            ) : null}
            {!isSearching && leadsQuery.isError ? (
              <div className="py-6 text-center text-destructive text-sm">
                Erro ao carregar os leads.
              </div>
            ) : null}
            {!(isSearching || leadsQuery.isError) && leads?.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Nenhum lead encontrado.
              </div>
            ) : null}
            <CommandGroup>
              {showAllLabel ? (
                <CommandItem onSelect={handleClear} value={showAllLabel}>
                  {showAllLabel}
                  {value === "" ? (
                    <CheckIcon className="ml-auto size-4" />
                  ) : null}
                </CommandItem>
              ) : null}
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
