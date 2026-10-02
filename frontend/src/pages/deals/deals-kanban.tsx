import type { DealDTO } from "@sales/shared";
import { Loader2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import AppShell, { useAppShell } from "../../components/app-shell.tsx";
import { ClearFiltersButton } from "../../components/clear-filters-button.tsx";
import { DealDetailsSidebar } from "../../components/deal-details-sidebar.tsx";
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
import { useSearchInput } from "../../hooks/use-search-input.ts";
import { useSellersQuery } from "../../hooks/use-sellers.ts";
import { useUrlFilters } from "../../hooks/use-url-filters.ts";
import { readText, readUuid } from "../../lib/url-filters.ts";
import { resolveBoardStatus } from "./kanban/board-status.ts";
import { DealsBoard } from "./kanban/deals-board.tsx";
import { useDealDrag } from "./kanban/use-deal-drag.ts";

/**
 * Lista vazia com referência estável.
 *
 * `dealsQuery.data ?? []` alocava um array novo a cada render enquanto o
 * primeiro load não voltava, e isso invalidava `patchedDeals` → `columns` em
 * cadeia — que é o `items` do `SortableContext`. Nunca chegou a doer porque
 * nesse intervalo o board mostra o skeleton, mas a referência instável é uma
 * bomba-relógio esperando o `status` ganhar um estado novo.
 */
const NO_DEALS: DealDTO[] = [];
/** Mesmo teto do `listDealsQuerySchema`: a URL pode vir de link colado. */
const MAX_TITLE_LENGTH = 150;

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
  // A URL é a fonte de verdade dos filtros: params viram estado de
  // navegação, então o board é compartilhável e o voltar desfaz filtro.
  const { pushFilter, commitSearch, searchParams } = useUrlFilters();
  const filters = useMemo(
    () => ({
      leadId: readUuid(searchParams, "leadId"),
      responsibleId: readUuid(searchParams, "responsibleId"),
      title: readText(searchParams, "title", MAX_TITLE_LENGTH),
    }),
    [searchParams]
  );

  const commitTitle = useCallback(
    (value: string) => {
      commitSearch({ title: value || null });
    },
    [commitSearch]
  );
  const searchInput = useSearchInput(filters.title, commitTitle);
  const {
    reset: resetSearch,
    setValue: setSearchValue,
    value: searchValue,
  } = searchInput;

  const [selectedDeal, setSelectedDeal] = useState<DealDTO | null>(null);
  const [editingDeal, setEditingDeal] = useState<DealDTO | null>(null);
  // Espelho do arrasto, só para pausar o polling: o `useDealDrag` é chamado
  // depois da query (ele consome a lista dela), e a query precisa saber se há
  // arrasto em andamento antes de devolver essa lista.
  const [isDragging, setIsDragging] = useState(false);

  const sellersQuery = useSellersQuery();
  const updateDeal = useUpdateDealMutation();
  const moveDeal = useMoveDealMutation();
  // Pausa durante arrasto/edição/mutação pendente: um refetch no meio sobrescreveria o patch otimista.
  // A sidebar aberta (selectedDeal) não pausa — ela só lê, e o activeDeal é rederivado a cada refetch.
  const dealsQuery = useDealsQuery(
    {
      leadId: filters.leadId || undefined,
      responsibleId: filters.responsibleId || undefined,
      title: filters.title || undefined,
    },
    isDragging || editingDeal !== null || moveDeal.isPending
  );

  useErrorToast(dealsQuery);
  useErrorToast(sellersQuery);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchValue(event.target.value);
    },
    [setSearchValue]
  );

  const handleResponsibleChange = useCallback(
    (value: string) => {
      pushFilter({ responsibleId: value || null });
    },
    [pushFilter]
  );

  const handleLeadChange = useCallback(
    (value: string) => {
      pushFilter({ leadId: value || null });
    },
    [pushFilter]
  );

  // Limpa o input na hora e a URL no mesmo clique: sem esperar o debounce
  // reescrever a busca com o valor que está sendo apagado.
  const clearSearch = useCallback(() => {
    resetSearch();
    pushFilter({ title: null });
  }, [pushFilter, resetSearch]);

  const clearFilters = useCallback(() => {
    resetSearch();
    pushFilter({ leadId: null, responsibleId: null, title: null });
  }, [pushFilter, resetSearch]);

  const closeSidebar = useCallback(() => {
    setSelectedDeal(null);
    setEditingDeal(null);
  }, []);

  const openEditDeal = useCallback((deal: DealDTO) => {
    setEditingDeal(deal);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingDeal(null);
  }, []);

  const retryDeals = useCallback(() => {
    dealsQuery.refetch();
  }, [dealsQuery]);

  const deals = dealsQuery.data ?? NO_DEALS;

  // Deep link `?leadId=`: o DTO dos deals já traz o nome do lead, então o
  // combobox resolve o label daqui em vez de uma query extra.
  const leadHint = useMemo(
    () => deals.find((deal) => deal.lead.id === filters.leadId)?.lead ?? null,
    [deals, filters.leadId]
  );

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
    filters.title !== "" ||
    filters.leadId !== "" ||
    filters.responsibleId !== "";

  // Sidebar/modal recebem sempre a versão mais fresca da lista (com patches
  // otimistas); o snapshot do clique só entra se o deal sair dos filtros.
  const activeDeal = selectedDeal
    ? (optimisticDeals.find((deal) => deal.id === selectedDeal.id) ??
      selectedDeal)
    : null;
  const activeEditingDeal = editingDeal
    ? (optimisticDeals.find((deal) => deal.id === editingDeal.id) ??
      editingDeal)
    : null;

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
              maxLength={MAX_TITLE_LENGTH}
              onChange={handleSearchChange}
              onClear={clearSearch}
              placeholder="Buscar por título..."
              value={searchValue}
            />
            <LeadCombobox
              className="w-full sm:w-64 lg:w-72"
              emptyLabel="Lead: Todos"
              leadHint={leadHint}
              onValueChange={handleLeadChange}
              placeholder="Buscar lead por nome ou empresa..."
              selectedPrefix="Lead: "
              showAllLabel="Todos"
              value={filters.leadId}
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
              value={filters.responsibleId}
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

      {activeDeal ? (
        <DealDetailsSidebar
          deal={activeDeal}
          onClose={closeSidebar}
          onEdit={openEditDeal}
        />
      ) : null}

      {activeEditingDeal ? (
        <UpdateDealModal deal={activeEditingDeal} onClose={closeEditModal} />
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
