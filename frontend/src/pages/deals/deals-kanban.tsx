import type { DealDTO } from "@sales/shared";
import { Loader2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell, { useAppShell } from "../../components/app-shell.tsx";
import { ClearFiltersButton } from "../../components/clear-filters-button.tsx";
import { FilterSearchInput } from "../../components/filter-search-input.tsx";
import { LeadCombobox } from "../../components/lead-combobox.tsx";
import { SellerCombobox } from "../../components/seller-combobox.tsx";
import UpdateDealModal from "../../components/update-deal-modal.tsx";
import {
  applyOptimisticMove,
  applyOptimisticPatch,
  useDealsQuery,
  useMoveDealMutation,
  useUpdateDealMutation,
} from "../../hooks/use-deals.ts";
import { useErrorToast } from "../../hooks/use-error-toast.ts";
import { useSellersQuery } from "../../hooks/use-sellers.ts";
import { resolveBoardStatus } from "./kanban/board-status.ts";
import { DealsBoard } from "./kanban/deals-board.tsx";
import { useDealDrag } from "./kanban/use-deal-drag.ts";

/**
 * A tela do board. Fica com o que é *da tela*: filtros, queries e o modal.
 *
 * A disposição dos cards e o arrasto vivem em `kanban/use-deal-drag.ts`; a
 * lista pure-mente virtualizada, em `kanban/kanban-column.tsx`. Ver
 * `kanban/README.md` para o mapa.
 */
function DealsKanbanPage() {
  return (
    <AppShell>
      <DealsKanbanContent />
    </AppShell>
  );
}

function DealsKanbanContent() {
  const { openDealModal } = useAppShell();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [leadId, setLeadId] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<DealDTO | null>(null);
  // Espelho do arrasto, só para pausar o polling: o `useDealDrag` é chamado
  // depois da query (ele consome a lista dela), e a query precisa saber se há
  // arrasto em andamento antes de devolver essa lista.
  const [isDragging, setIsDragging] = useState(false);

  const sellersQuery = useSellersQuery();
  const updateDeal = useUpdateDealMutation();
  const moveDeal = useMoveDealMutation();
  // Pausa durante arrasto/modal/mutação pendente: um refetch no meio sobrescreveria o patch otimista.
  const dealsQuery = useDealsQuery(
    {
      leadId: leadId || undefined,
      responsibleId: responsibleId || undefined,
      title: debouncedSearch || undefined,
    },
    isDragging ||
      selectedDeal !== null ||
      updateDeal.isPending ||
      moveDeal.isPending
  );

  useErrorToast(dealsQuery);
  useErrorToast(sellersQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
    },
    []
  );

  const handleResponsibleChange = useCallback((value: string) => {
    setResponsibleId(value);
  }, []);

  // Limpa o estado já debounced: senão a busca reaplicaria o filtro por 300ms.
  const clearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setLeadId("");
    setResponsibleId("");
  }, []);

  const closeDealModal = useCallback(() => {
    setSelectedDeal(null);
  }, []);

  const retryDeals = useCallback(() => {
    dealsQuery.refetch();
  }, [dealsQuery]);

  const deals = dealsQuery.data ?? [];

  // Deriva os patches pendentes no render: o onMutate do React Query roda um
  // microtask depois do mutate(), e nesse 1 commit o card voltaria à coluna de
  // origem — foi exatamente o que o ADR features/002 chamou de "fantasma".
  const pendingUpdate = updateDeal.isPending ? updateDeal.variables : null;
  const pendingMove = moveDeal.isPending ? moveDeal.variables : null;
  const patchedDeals = useMemo(
    () =>
      deals.map((deal) =>
        pendingUpdate && deal.id === pendingUpdate.id
          ? applyOptimisticPatch(deal, pendingUpdate.data)
          : deal
      ),
    [deals, pendingUpdate]
  );
  const optimisticDeals = useMemo(
    () =>
      pendingMove
        ? applyOptimisticMove(
            patchedDeals,
            pendingMove.dealId,
            pendingMove.input
          )
        : patchedDeals,
    [patchedDeals, pendingMove]
  );

  // Uma linha só para a tela: a query alimenta o arrasto, e o arrasto devolve
  // a disposição final. `columns` sai daqui já — o board não decide layout.
  const drag = useDealDrag({
    deals: optimisticDeals,
    moveDeal,
    onDraggingChange: setIsDragging,
  });

  const { isError, isFetching, isPending, isPlaceholderData } = dealsQuery;
  const hasActiveFilters =
    search.trim() !== "" || leadId !== "" || responsibleId !== "";

  return (
    <>
      <section
        aria-labelledby="deals-title"
        className="border-zinc-800/60 border-b px-6 py-5 md:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-52">
            <p className="font-semibold text-[11px] text-orange-400/80 uppercase tracking-widest">
              CRM — Pipeline
            </p>
            <h1
              className="mt-1 font-bold text-2xl text-white tracking-tight"
              id="deals-title"
            >
              Negócios
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              {isFetching ? (
                <Loader2
                  aria-hidden
                  className="animate-spin text-orange-400"
                  size={12}
                />
              ) : (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                />
              )}
              <DealsCounter count={deals.length} filtered={hasActiveFilters} />
            </p>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
            <FilterSearchInput
              ariaLabel="Buscar negócio por título"
              onChange={handleSearchChange}
              onClear={clearSearch}
              placeholder="Buscar por título..."
              value={search}
            />
            <LeadCombobox
              className="w-full sm:w-64 lg:w-72"
              emptyLabel="Lead: Todos"
              onValueChange={setLeadId}
              placeholder="Buscar lead por nome ou empresa..."
              selectedPrefix="Lead: "
              showAllLabel="Todos"
              value={leadId}
            />
            <SellerCombobox
              className="w-full sm:w-52"
              emptyLabel="Vendedor: Todos"
              isError={sellersQuery.isError}
              isPending={sellersQuery.isPending}
              onValueChange={handleResponsibleChange}
              placeholder="Buscar vendedor..."
              selectedPrefix="Vendedor: "
              sellers={sellersQuery.data}
              showAllLabel="Todos"
              value={responsibleId}
            />
            {hasActiveFilters ? (
              <ClearFiltersButton onClear={clearFilters} />
            ) : null}
          </div>
        </div>
      </section>

      <main aria-busy={isPlaceholderData} className="px-4 py-6 md:px-8">
        <div
          className={`transition-opacity ${
            isPlaceholderData ? "opacity-60" : "opacity-100"
          }`}
        >
          <DealsBoard
            deals={optimisticDeals}
            drag={drag}
            isDragDisabled={isPlaceholderData}
            onClearFilters={clearFilters}
            onCreateDeal={openDealModal}
            onRetry={retryDeals}
            onSelect={setSelectedDeal}
            status={resolveBoardStatus(
              isPending,
              isError,
              deals.length,
              hasActiveFilters
            )}
          />
        </div>
      </main>

      {selectedDeal ? (
        <UpdateDealModal deal={selectedDeal} onClose={closeDealModal} />
      ) : null}
    </>
  );
}

function DealsCounter({
  count,
  filtered,
}: {
  count: number;
  filtered: boolean;
}) {
  if (filtered) {
    return <>{count === 1 ? "1 resultado" : `${count} resultados`}</>;
  }
  return (
    <>
      {count === 1 ? "1 negócio no pipeline" : `${count} negócios no pipeline`}
    </>
  );
}

export default DealsKanbanPage;
