import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DealDTO, DealStatus } from "@sales/shared";
import { CalendarDays, GripVertical, Loader2, Search, X } from "lucide-react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/app-shell.tsx";
import { SellerCombobox } from "../../components/seller-combobox.tsx";
import { Input } from "../../components/ui/input.tsx";
import UpdateDealModal from "../../components/update-deal-modal.tsx";
import {
  applyOptimisticPatch,
  useDealsQuery,
  useUpdateDealMutation,
} from "../../hooks/use-deals.ts";
import { useErrorToast } from "../../hooks/use-error-toast.ts";
import { useSellersQuery } from "../../hooks/use-sellers.ts";
import { formatDealStatus, formatDealValue } from "../../lib/deal-options.ts";
import { initialsOf } from "../../lib/utils.ts";

const DEAL_COLUMNS: Array<{
  accent: string;
  dot: string;
  status: DealStatus;
}> = [
  { accent: "text-orange-400", dot: "bg-orange-400", status: "open" },
  { accent: "text-sky-400", dot: "bg-sky-400", status: "negotiating" },
  { accent: "text-emerald-400", dot: "bg-emerald-400", status: "won" },
  { accent: "text-rose-400", dot: "bg-rose-400", status: "lost" },
];

// O DTO traz "YYYY-MM-DD" sem fuso: sem o `T00:00:00` o JS parseria como UTC
// e, em UTC-3, mostraria o dia anterior.
function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

// Recebe `unknown`: valida contra as colunas conhecidas em vez de castar e descarta drop inválido.
function resolveTargetStatus(status: unknown): DealStatus | undefined {
  return DEAL_COLUMNS.find((column) => column.status === status)?.status;
}

function DealsKanbanPage() {
  return (
    <AppShell>
      <DealsKanbanContent />
    </AppShell>
  );
}

function DealsKanbanContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<DealDTO | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<DealStatus | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | undefined>(
    undefined
  );

  const sellersQuery = useSellersQuery();
  const updateDeal = useUpdateDealMutation();
  // Pausa durante arrasto/modal/PATCH pendente: um refetch no meio sobrescreveria o patch otimista.
  const dealsQuery = useDealsQuery(
    {
      responsibleId: responsibleId || undefined,
      title: debouncedSearch || undefined,
    },
    activeId !== null || selectedDeal !== null || updateDeal.isPending
  );
  // Referência estável entre renders: uma nova a cada render faria o DndContext remontar os sensores no meio do arrasto.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
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

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const closeDealModal = useCallback(() => {
    setSelectedDeal(null);
  }, []);

  const deals = dealsQuery.data ?? [];

  const clearDragState = useCallback(() => {
    setActiveId(null);
    setOverlayWidth(undefined);
    setPreviewStatus(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (typeof event.active.id === "string") {
      setActiveId(event.active.id);
      // Overlay é position: fixed; sem congelar a largura ele "pula" ao arrastar.
      setOverlayWidth(event.active.rect.current.initial?.width);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const dealId = event.active.id;
      if (typeof dealId !== "string") {
        return;
      }
      const target = resolveTargetStatus(event.over?.data.current?.status);
      const original = deals.find((deal) => deal.id === dealId)?.status;
      setPreviewStatus(target === original ? null : (target ?? null));
    },
    [deals]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dealId = event.active.id;
      const targetStatus = resolveTargetStatus(
        event.over?.data.current?.status
      );
      // Vem do cache, não do `active.data`, que já reflete o preview local.
      const originalStatus =
        typeof dealId === "string"
          ? deals.find((deal) => deal.id === dealId)?.status
          : undefined;

      clearDragState();

      if (
        typeof dealId !== "string" ||
        targetStatus === undefined ||
        targetStatus === originalStatus
      ) {
        return;
      }

      updateDeal.mutate({ data: { status: targetStatus }, id: dealId });
    },
    [clearDragState, deals, updateDeal]
  );

  // Além do preview, deriva o patch pendente: o onMutate do React Query roda um
  // microtask depois do mutate(), e nesse 1 commit o card piscaria na coluna de origem.
  const pendingUpdate = updateDeal.isPending ? updateDeal.variables : null;
  const visibleDeals = deals.map((deal) => {
    if (deal.id === activeId && previewStatus !== null) {
      return { ...deal, status: previewStatus };
    }
    if (pendingUpdate && deal.id === pendingUpdate.id) {
      return applyOptimisticPatch(deal, pendingUpdate.data);
    }
    return deal;
  });
  const activeDeal =
    activeId === null
      ? null
      : (deals.find((deal) => deal.id === activeId) ?? null);
  const isRefreshing = dealsQuery.isFetching && !dealsQuery.isPending;

  return (
    <>
      <header className="border-zinc-800/60 border-b px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-52">
            <p className="font-semibold text-[11px] text-orange-400/80 uppercase tracking-widest">
              CRM — Pipeline
            </p>
            <h1 className="mt-1 font-bold text-2xl text-white tracking-tight">
              Negócios
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
              {dealsQuery.isFetching ? (
                <Loader2 className="animate-spin text-orange-400" size={12} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              {deals.length} {deals.length === 1 ? "negócio" : "negócios"} no
              pipeline
            </p>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
            <div className="relative w-full sm:w-64 lg:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-600"
                size={16}
              />
              <Input
                aria-label="Buscar deal por título"
                className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
                onChange={handleSearchChange}
                placeholder="Buscar por título..."
                type="search"
                value={search}
              />
              {search === "" ? null : (
                <button
                  aria-label="Limpar busca"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-zinc-200"
                  onClick={clearSearch}
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <SellerCombobox
              className="w-full sm:w-52"
              emptyLabel="Vendedor: Todos"
              isPending={sellersQuery.isPending}
              onValueChange={handleResponsibleChange}
              placeholder="Buscar vendedor..."
              selectedPrefix="Vendedor: "
              sellers={sellersQuery.data}
              showAllLabel="Todos"
              value={responsibleId}
            />
          </div>
        </div>
      </header>

      <main
        className={`px-4 py-6 transition-opacity md:px-8 ${
          isRefreshing ? "opacity-60" : "opacity-100"
        }`}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragCancel={clearDragState}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {DEAL_COLUMNS.map(({ status, dot, accent }) => (
              <KanbanColumn
                accent={accent}
                deals={visibleDeals.filter((deal) => deal.status === status)}
                dot={dot}
                isDropTarget={previewStatus === status}
                key={status}
                onSelect={setSelectedDeal}
                status={status}
              />
            ))}
          </div>
          {/* dropAnimation={null}: o update otimista já posiciona o card real no mesmo commit — animar o clone por cima geraria um "fantasma". */}
          <DragOverlay dropAnimation={null}>
            {activeDeal ? (
              <div
                className="cursor-grabbing rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl shadow-black/60"
                style={{ width: overlayWidth }}
              >
                <DealCardView deal={activeDeal} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {selectedDeal ? (
        <UpdateDealModal deal={selectedDeal} onClose={closeDealModal} />
      ) : null}
    </>
  );
}

function KanbanColumn({
  accent,
  deals,
  dot,
  isDropTarget,
  onSelect,
  status,
}: {
  accent: string;
  deals: DealDTO[];
  dot: string;
  isDropTarget: boolean;
  onSelect: (deal: DealDTO) => void;
  status: DealStatus;
}) {
  const { setNodeRef } = useDroppable({ data: { status }, id: status });
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0);

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-zinc-900/40 transition-colors ${
        isDropTarget
          ? "border-orange-500/50 ring-2 ring-orange-500/20"
          : "border-zinc-800/80"
      }`}
      data-status={status}
      ref={setNodeRef}
    >
      <div className="flex items-center justify-between gap-3 border-zinc-800/60 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <span
            className={`shrink-0 whitespace-nowrap font-semibold text-xs uppercase tracking-widest ${accent}`}
          >
            {formatDealStatus(status)}
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-medium text-[11px] text-zinc-400">
            {deals.length}
          </span>
        </div>
        <span
          className="min-w-0 truncate font-semibold text-[11px] text-zinc-500"
          title={formatDealValue(totalValue)}
        >
          {formatDealValue(totalValue)}
        </span>
      </div>

      <div className="max-h-[62vh] min-h-28 flex-1 space-y-2.5 overflow-y-auto p-3">
        <SortableContext
          items={deals.map((deal) => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard deal={deal} key={deal.id} onSelect={onSelect} />
          ))}
        </SortableContext>
        {deals.length === 0 ? (
          <div
            className={`flex h-24 items-center justify-center rounded-xl border border-dashed text-xs transition-colors ${
              isDropTarget
                ? "border-orange-500/50 text-zinc-400"
                : "border-zinc-800/80 text-zinc-600"
            }`}
          >
            {isDropTarget
              ? "Solte para mover para cá"
              : "Arraste um card para cá"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  onSelect,
}: {
  deal: DealDTO;
  onSelect: (deal: DealDTO) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ data: { status: deal.status }, id: deal.id });

  // Clique não vira drag: o sensor só ativa após 6px e o dnd-kit suprime o click de um arrasto real.
  const handleCardClick = useCallback(() => {
    onSelect(deal);
  }, [deal, onSelect]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(deal);
      }
    },
    [deal, onSelect]
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role/tabIndex/foco vêm de {...attributes} do useSortable; Enter/Espaço tratados em onKeyDown
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: ver comentário acima — o linter não enxerga o role injetado pelo spread
    <div
      className={`group cursor-grab touch-none rounded-xl border border-zinc-800/80 bg-zinc-900 p-3 shadow-sm transition-colors hover:border-zinc-700/80 focus-visible:outline-2 focus-visible:outline-orange-500/70 focus-visible:outline-offset-2 active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
      data-deal-id={deal.id}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <DealCardView deal={deal} />
    </div>
  );
}

// Sem hooks do dnd-kit: o DragOverlay não pode reenderizar useSortable (colisão de id).
function DealCardView({ deal }: { deal: DealDTO }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm text-zinc-100">{deal.title}</span>
        <GripVertical
          className="shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-500"
          size={14}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">{deal.lead.companyName}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold text-orange-300 text-sm">
          {formatDealValue(deal.value)}
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-semibold text-[9px] text-orange-300">
          {initialsOf(deal.responsible.name)}
        </span>
      </div>

      {deal.expectedCloseDate ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-zinc-600">
          <CalendarDays size={11} />
          {formatDate(deal.expectedCloseDate)}
        </p>
      ) : null}
    </>
  );
}

export default DealsKanbanPage;
