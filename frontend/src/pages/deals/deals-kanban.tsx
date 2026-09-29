import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  pointerWithin,
  rectIntersection,
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
import {
  CalendarClock,
  CalendarDays,
  GripVertical,
  Handshake,
  Loader2,
  Plus,
  RefreshCw,
  SearchX,
} from "lucide-react";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell, { useAppShell } from "../../components/app-shell.tsx";
import { ClearFiltersButton } from "../../components/clear-filters-button.tsx";
import { FilterSearchInput } from "../../components/filter-search-input.tsx";
import { LeadCombobox } from "../../components/lead-combobox.tsx";
import { SellerCombobox } from "../../components/seller-combobox.tsx";
import { Button } from "../../components/ui/button.tsx";
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
import { formatDealStatus } from "../../lib/deal-options.ts";
import {
  formatCreatedAt,
  formatCurrency,
  formatExpectedCloseDate,
  formatFullDate,
} from "../../lib/format.ts";
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

/** Primeiro load, erro, vazio com filtro e vazio sem filtro são leituras distintas. */
type BoardStatus = "empty" | "error" | "filtered" | "loading" | "ready";

type DndSensors = ReturnType<typeof useSensors>;

const COLUMN_IDS = new Set<string>(DEAL_COLUMNS.map((column) => column.status));

/** Casca visual do card. Compartilhada com o slot para os dois terem a mesma altura. */
const CARD_SHELL =
  "rounded-xl border border-zinc-800/80 bg-zinc-900 p-3 shadow-sm";

/**
 * Card sobre a coluna, sempre.
 *
 * O `closestCenter` compara distâncias até o centro, e numa coluna alta o
 * centro fica longe do ponteiro: o mesmo drop podia resolver para a coluna
 * (card vai para o fim) ou para o card (card fica naquele slot), dependendo de
 * meio pixel. `pointerWithin` dá os candidatos pelo ponto do ponteiro, e o
 * card é sempre o mais específico deles.
 */
const preferCardCollision: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const card = collisions.find(
    (collision) => !COLUMN_IDS.has(String(collision.id))
  );

  if (card) {
    return [card];
  }

  return collisions.length > 0 ? collisions : rectIntersection(args);
};

// Recebe `unknown`: valida contra as colunas conhecidas em vez de castar e descartar drop inválido.
function resolveTargetStatus(status: unknown): DealStatus | undefined {
  return DEAL_COLUMNS.find((column) => column.status === status)?.status;
}

/** Slot vago que o card arrastado abriria na coluna de destino. */
interface Placeholder {
  index: number;
  status: DealStatus;
}

/** Ids em ordem de exibição, agrupados por coluna do board. */
type BoardColumns = Record<DealStatus, string[]>;

function buildColumns(deals: DealDTO[]): BoardColumns {
  const columns: BoardColumns = {
    lost: [],
    negotiating: [],
    open: [],
    won: [],
  };

  for (const deal of deals) {
    columns[deal.status].push(deal.id);
  }

  return columns;
}

function findColumnOf(
  columns: BoardColumns,
  dealId: string
): DealStatus | undefined {
  return DEAL_COLUMNS.find(({ status }) => columns[status].includes(dealId))
    ?.status;
}

const NO_DEALS: DealDTO[] = [];
const NO_ITEMS: string[] = [];

/** Onde o card estava quando o arrasto começou, para reconhecer um drag sem efeito. */
function originAnchorOf(
  origin: BoardColumns,
  dealId: string
): { afterDealId: string | null; status: DealStatus } | null {
  const status = findColumnOf(origin, dealId);
  if (!status) {
    return null;
  }

  const index = origin[status].indexOf(dealId);
  return {
    afterDealId: index > 0 ? (origin[status][index - 1] ?? null) : null,
    status,
  };
}

/**
 * Tira `dealId` de onde estiver e reinsere em `target` na posição `index`.
 *
 * Não toca no DOM: só descreve onde o card cairia. Devolve `null` quando nada
 * muda — o `onDragOver` dispara a cada mousemove, e recalcular a cada pixel
 * seria trabalho jogado fora.
 */
function placeInColumn(
  columns: BoardColumns,
  dealId: string,
  target: DealStatus,
  index: number
): BoardColumns | null {
  const from = findColumnOf(columns, dealId);
  if (!from) {
    return null;
  }

  const rest = DEAL_COLUMNS.reduce<BoardColumns>(
    (acc, { status }) => {
      acc[status] = columns[status].filter((id) => id !== dealId);
      return acc;
    },
    { lost: [], negotiating: [], open: [], won: [] }
  );

  const bounded = Math.max(0, Math.min(index, rest[target].length));
  if (from === target && columns[target][bounded] === dealId) {
    return null;
  }

  rest[target] = [
    ...rest[target].slice(0, bounded),
    dealId,
    ...rest[target].slice(bounded),
  ];

  return rest;
}

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
  const [activeId, setActiveId] = useState<string | null>(null);
  // Disposição final, do instante em que o card é solto até o servidor
  // responder. Durante o arrasto a lista renderizada NÃO muda: ver
  // `handleDragOver` para o porquê. `null` = nada aguardando o servidor.
  const [settledColumns, setSettledColumns] = useState<BoardColumns | null>(
    null
  );
  // Slot que o card abriria na coluna de destino, só para dar a lacuna
  // visível. Muda ao cruzar a borda de um card, não a cada pixel.
  const [targetSlot, setTargetSlot] = useState<Placeholder | null>(null);
  const [overColumn, setOverColumn] = useState<DealStatus | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | undefined>(
    undefined
  );
  // Onde o card cairia se fosse solto agora. O `onDragEnd` precisa ler o valor
  // mais recente, que ainda pode não ter virado render.
  const dragColumnsRef = useRef<BoardColumns | null>(null);
  // Disposição no momento em que o arrasto começou, para a guarda de noop.
  const originColumnsRef = useRef<BoardColumns | null>(null);

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
    activeId !== null ||
      selectedDeal !== null ||
      updateDeal.isPending ||
      moveDeal.isPending
  );
  // Só mouse: sem sensor de toque a rolagem vertical no mobile não vira arrasto.
  // Referência estável entre renders — recriá-la remontaria os sensores no meio do arrasto.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } })
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

  const clearDragState = useCallback(() => {
    dragColumnsRef.current = null;
    originColumnsRef.current = null;
    setActiveId(null);
    setOverlayWidth(undefined);
    setOverColumn(null);
    setTargetSlot(null);
  }, []);

  // Cancelar: sem mutação, só o estado do arrasto some.
  const cancelDrag = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const dealId = event.active.id;
      if (typeof dealId !== "string") {
        return;
      }
      const snapshot = buildColumns(deals);
      dragColumnsRef.current = snapshot;
      originColumnsRef.current = snapshot;
      setActiveId(dealId);
      // Nada de reservar slot na origem: o card continua na lista, só
      // invisível (`isDragging` → opacity-0), e o dnd-kit desliza os irmãos em
      // volta dele. É o comportamento nativo dele, e é o que mantém a lista
      // renderizada imóvel durante todo o arrasto.
      setTargetSlot(null);
      // Overlay é position: fixed; sem congelar a largura ele "pula" ao arrastar.
      setOverlayWidth(event.active.rect.current.initial?.width);
    },
    [deals]
  );

  /**
   * Só descreve onde o card cairia — nada aqui reordena a lista renderizada.
   *
   * Quando a lista mudava, o `SortableContext` via `itemsHaveChanged` mandava
   * o dnd-kit remedir o board inteiro: ~700 `getBoundingClientRect` forçando
   * layout síncrono a cada reposicionamento, e era isso que travava a main
   * thread. Medido: 2.980 medições num arrasto de 1s, 3.700 ms de thread
   * bloqueada. Com a lista parada isso vai a zero e o reflow visual passa a ser
   * o `transform` que o dnd-kit já aplicava por baixo.
   */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const dealId = event.active.id;
    const overId = event.over?.id;
    const { current } = dragColumnsRef;
    if (typeof dealId !== "string" || typeof overId !== "string" || !current) {
      return;
    }

    // O `data` do card carrega o status do SERVIDOR, que não é a coluna em que
    // ele está sendo exibido durante o arrasto — usar isso acenderia a coluna
    // de origem quando o ponteiro está sobre o próprio card. O id não mente:
    // o droppable da coluna tem `id === status`.
    setOverColumn(
      resolveTargetStatus(overId) ?? findColumnOf(current, overId) ?? null
    );

    // `over` é o próprio card: realocar aqui geraria trabalho por pixel.
    if (overId === dealId) {
      return;
    }

    const targetColumn = resolveTargetStatus(overId);
    // `over` é a coluna inteira quando o ponteiro está na área vazia dela.
    const next = targetColumn
      ? placeInColumn(
          current,
          dealId,
          targetColumn,
          current[targetColumn].length
        )
      : (() => {
          const target = findColumnOf(current, overId);
          return target
            ? placeInColumn(
                current,
                dealId,
                target,
                current[target].indexOf(overId)
              )
            : null;
        })();

    if (!next) {
      return;
    }

    dragColumnsRef.current = next;
    const landed = findColumnOf(next, dealId);

    if (landed === undefined) {
      return;
    }

    // A lacuna só é desenhada quando o card vem de outra coluna. Dentro da
    // própria coluna quem abre espaço é o transform do dnd-kit; desenhar o
    // slot aqui duplicaria o card. É um div comum, fora do SortableContext —
    // por isso não altera `items` e não dispara remedição.
    const index = next[landed].indexOf(dealId);
    setTargetSlot((prev) =>
      prev !== null && prev.status === landed && prev.index === index
        ? prev
        : { index, status: landed }
    );
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dealId = event.active.id;
      const finalColumns = dragColumnsRef.current;
      const origin = originColumnsRef.current;
      clearDragState();

      if (typeof dealId !== "string" || !finalColumns) {
        return;
      }

      // A coluna final e a posição dentro dela já são a resposta: o onDragOver
      // foi reposicionando o card enquanto ele viajava. A âncora é o vizinho
      // imediatamente anterior — não precisa de heurística de "metade de cima".
      const status = findColumnOf(finalColumns, dealId);
      if (!status) {
        return;
      }
      const index = finalColumns[status].indexOf(dealId);
      const afterDealId =
        index > 0 ? (finalColumns[status][index - 1] ?? null) : null;

      // Nada mudou de lugar: não vale uma request. Compara com o snapshot de
      // origem, e não com a lista global — os cards de uma coluna são uma
      // subsequência da global, então o antecessor global quase nunca é o
      // vizinho dentro da coluna.
      const originAnchor =
        origin === null ? null : originAnchorOf(origin, dealId);
      if (
        originAnchor !== null &&
        originAnchor.status === status &&
        originAnchor.afterDealId === afterDealId
      ) {
        return;
      }

      // Segura a disposição final até o servidor responder. Se zerar na hora,
      // o `isPending` do React Query só chega no tick seguinte e o board
      // voltaria à coluna de origem por 1 commit — o card piscando de volta.
      // Aqui é o ÚNICO ponto do fluxo que escreve a lista renderizada, e
      // acontece uma vez por arrasto, não por pixel.
      setSettledColumns(finalColumns);
      moveDeal.mutate(
        { dealId, input: { afterDealId, status } },
        { onSettled: () => setSettledColumns(null) }
      );
    },
    [clearDragState, moveDeal]
  );

  // Deriva os patches pendentes no render: o onMutate do React Query roda um
  // microtask depois do mutate(), e nesse 1 commit o card voltaria à coluna de
  // origem — foi exatamente o que o ADR features/002 chamou de "fantasma".
  const pendingUpdate = updateDeal.isPending ? updateDeal.variables : null;
  const pendingMove = moveDeal.isPending ? moveDeal.variables : null;
  // Tudo memoizado: o `items` do SortableContext é copiado pelo dnd-kit para
  // configurar o ResizeObserver do useDroppable. Array novo a cada render
  // re-registra o observer, que mede, seta estado e re-renderiza — o ciclo se
  // fecha e o React reclama de "maximum update depth".
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
  const serverColumns = useMemo(
    () => buildColumns(optimisticDeals),
    [optimisticDeals]
  );
  const columns = settledColumns ?? serverColumns;
  const activeDeal =
    activeId === null
      ? null
      : (deals.find((deal) => deal.id === activeId) ?? null);
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
            activeDeal={activeDeal}
            columns={columns}
            deals={optimisticDeals}
            isDragDisabled={isPlaceholderData}
            onCancelDrag={cancelDrag}
            onClearFilters={clearFilters}
            onCreateDeal={openDealModal}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onRetry={retryDeals}
            onSelect={setSelectedDeal}
            overColumn={overColumn}
            overlayWidth={overlayWidth}
            placeholder={targetSlot}
            sensors={sensors}
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

function resolveBoardStatus(
  isPending: boolean,
  isError: boolean,
  count: number,
  hasActiveFilters: boolean
): BoardStatus {
  if (isPending) {
    return "loading";
  }
  // O React Query mantém `data` quando um refetch de background falha: sem esta
  // guarda, um único poll malsucedido derrubaria o board inteiro a cada 10s.
  if (isError && count === 0) {
    return "error";
  }
  if (count > 0) {
    return "ready";
  }
  return hasActiveFilters ? "filtered" : "empty";
}

interface DealsBoardProps {
  activeDeal: DealDTO | null;
  columns: BoardColumns;
  deals: DealDTO[];
  isDragDisabled: boolean;
  onCancelDrag: () => void;
  onClearFilters: () => void;
  onCreateDeal: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragStart: (event: DragStartEvent) => void;
  onRetry: () => void;
  onSelect: (deal: DealDTO) => void;
  overColumn: DealStatus | null;
  overlayWidth: number | undefined;
  placeholder: Placeholder | null;
  sensors: DndSensors;
  status: BoardStatus;
}

function DealsBoard({
  activeDeal,
  columns,
  deals,
  isDragDisabled,
  onCancelDrag,
  onClearFilters,
  onCreateDeal,
  onDragEnd,
  onDragOver,
  onDragStart,
  onRetry,
  onSelect,
  overColumn,
  overlayWidth,
  placeholder,
  sensors,
  status,
}: DealsBoardProps) {
  const byId = useMemo(
    () => new Map(deals.map((deal) => [deal.id, deal])),
    [deals]
  );
  const dealsByColumn = useMemo(
    () =>
      new Map(
        DEAL_COLUMNS.map(({ status: columnStatus }) => [
          columnStatus,
          columns[columnStatus]
            .map((id) => byId.get(id))
            .filter((deal): deal is DealDTO => deal !== undefined),
        ])
      ),
    [byId, columns]
  );
  const itemsByColumn = useMemo(
    () =>
      new Map(
        DEAL_COLUMNS.map(({ status: columnStatus }) => [
          columnStatus,
          dealsByColumn.get(columnStatus)?.map((deal) => deal.id) ?? [],
        ])
      ),
    [dealsByColumn]
  );

  if (status === "loading") {
    return <KanbanSkeleton />;
  }

  if (status === "error") {
    // O toast continua sendo a notificação global; aqui só o retry inline.
    return (
      <BoardMessage
        action={
          <Button onClick={onRetry} size="sm" type="button" variant="secondary">
            <RefreshCw size={14} strokeWidth={2.5} />
            Tentar novamente
          </Button>
        }
        description="Não foi possível carregar os negócios. Verifique a conexão e tente novamente."
        icon={
          <RefreshCw aria-hidden className="mx-auto text-zinc-600" size={28} />
        }
        title="Erro ao carregar o pipeline"
      />
    );
  }

  if (status === "filtered") {
    return (
      <BoardMessage
        action={<ClearFiltersButton onClear={onClearFilters} />}
        description="Ajuste os filtros ou limpe tudo para ver o pipeline completo novamente."
        icon={<SearchX className="mx-auto text-zinc-600" size={28} />}
        title="Nenhum negócio corresponde aos filtros"
      />
    );
  }

  if (status === "empty") {
    return (
      <BoardMessage
        action={
          <Button onClick={onCreateDeal} size="sm" type="button">
            <Plus size={16} strokeWidth={2.5} />
            Cadastrar negócio
          </Button>
        }
        description="Crie o primeiro negócio para começar a mover cards entre as etapas do pipeline."
        icon={<Handshake className="mx-auto text-zinc-600" size={28} />}
        title="Nenhum negócio no pipeline ainda"
      />
    );
  }

  return (
    <DndContext
      collisionDetection={preferCardCollision}
      onDragCancel={onCancelDrag}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DEAL_COLUMNS.map(({ status: columnStatus, dot, accent }) => (
          <KanbanColumn
            accent={accent}
            deals={dealsByColumn.get(columnStatus) ?? NO_DEALS}
            dot={dot}
            isDragDisabled={isDragDisabled}
            isDropTarget={overColumn === columnStatus}
            items={itemsByColumn.get(columnStatus) ?? NO_ITEMS}
            key={columnStatus}
            onSelect={onSelect}
            placeholder={
              // A lacuna só aparece na coluna de DESTINO. Na de origem o card
              // segue na lista, invisível, e o transform do dnd-kit abre espaço
              // em volta dele — um slot aqui viraria um N+1 fantasma ao lado de
              // um card que não saiu de lugar.
              placeholder !== null &&
              placeholder.status === columnStatus &&
              activeDeal !== null &&
              activeDeal.status !== columnStatus
                ? placeholder
                : null
            }
            placeholderDeal={activeDeal}
            status={columnStatus}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? (
          <div
            className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl shadow-black/60"
            style={{ width: overlayWidth }}
          >
            <DealCardView deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface BoardMessageProps {
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}

function BoardMessage({ action, description, icon, title }: BoardMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 border-dashed bg-zinc-900/40 px-6 py-16 text-center">
      {icon}
      <p className="mt-3 font-medium text-sm text-zinc-200">{title}</p>
      <p className="mt-1 max-w-md text-sm text-zinc-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div
      aria-label="Carregando negócios"
      className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4"
      role="status"
    >
      {DEAL_COLUMNS.map(({ status }) => (
        <div
          className="flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3"
          key={status}
        >
          <div className="mb-3 h-6 w-24 animate-pulse rounded-md bg-zinc-800" />
          <div className="mb-2.5 h-24 animate-pulse rounded-xl bg-zinc-800/60" />
          <div className="h-24 animate-pulse rounded-xl bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}

const KanbanColumn = memo(function MemoKanbanColumn({
  accent,
  deals,
  dot,
  isDragDisabled,
  isDropTarget,
  items,
  onSelect,
  placeholder,
  placeholderDeal,
  status,
}: {
  accent: string;
  deals: DealDTO[];
  dot: string;
  /** Ids na ordem de exibição, com referência estável (ver memoização no board). */
  items: string[];
  isDragDisabled: boolean;
  isDropTarget: boolean;
  onSelect: (deal: DealDTO) => void;
  placeholder: Placeholder | null;
  /** Card arrastado, usado para dar ao slot a altura exata. */
  placeholderDeal: DealDTO | null;
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
          <span
            aria-hidden
            className={`h-2 w-2 shrink-0 rounded-full ${dot}`}
          />
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
          className="min-w-0 truncate font-semibold text-[11px] text-zinc-400"
          title={formatCurrency(totalValue)}
        >
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Altura limitada e scroll interno só no desktop: no mobile a coluna cresce e a página rola. */}
      <div className="min-h-28 flex-1 space-y-2.5 p-3 md:max-h-[62vh] md:overflow-y-auto">
        {/* O slot mora dentro do SortableContext por precisar ficar entre dois
            cards, mas não é um item: é um div sem `useSortable`, então não
            entra em `items` e não dispara remedição do dnd-kit. */}
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {deals.flatMap((deal, index) => {
            const row: ReactNode[] = [];
            if (placeholder?.index === index && placeholderDeal !== null) {
              row.push(<PlaceholderSlot deal={placeholderDeal} key="slot" />);
            }
            row.push(
              <DealCard
                deal={deal}
                disabled={isDragDisabled}
                key={deal.id}
                onSelect={onSelect}
                position={index + 1}
              />
            );
            return row;
          })}
          {deals.length > 0 &&
          placeholder !== null &&
          placeholder.index >= deals.length &&
          placeholderDeal !== null ? (
            <PlaceholderSlot deal={placeholderDeal} key="slot" />
          ) : null}
        </SortableContext>
        {deals.length === 0 ? (
          <div
            className={`flex h-24 items-center justify-center rounded-xl border border-dashed px-2 text-center text-xs transition-colors ${
              isDropTarget
                ? "border-orange-500/50 text-zinc-300"
                : "border-zinc-800/80 text-zinc-400"
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
});

function PlaceholderSlot({ deal }: { deal: DealDTO }) {
  // O card invisível é o que dá a altura exata do slot (a linha "Prev."
  // depende do negócio). Medir em JS daria um commit atrasado, e a coluna de
  // origem daria um pulo.
  return (
    <div aria-hidden className={`${CARD_SHELL} invisible`}>
      <DealCardView deal={deal} />
    </div>
  );
}

const DealCard = memo(function MemoDealCard({
  deal,
  disabled,
  onSelect,
  position,
}: {
  deal: DealDTO;
  disabled: boolean;
  onSelect: (deal: DealDTO) => void;
  position: number;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    animateLayoutChanges: () => false,
    data: { dealId: deal.id, status: deal.status },
    disabled,
    id: deal.id,
  });

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
      className={`group ${CARD_SHELL} transition-colors hover:border-zinc-700/80 focus-visible:outline-2 focus-visible:outline-orange-500/70 focus-visible:outline-offset-2 md:cursor-grab md:active:cursor-grabbing ${
        // Invisible: o overlay é a cópia visível. O nó fica no lugar só para
        // reservar o espaço, e é nele que o dropAnimation do overlay pousa.
        isDragging ? "opacity-0" : ""
      }`}
      data-deal-id={deal.id}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <DealCardView deal={deal} position={position} />
    </div>
  );
});

/**
 * Sem hooks do dnd-kit: o DragOverlay não pode reenderizar useSortable (colisão
 * de id). E memoizada, porque é o que segura o custo real do arrasto.
 *
 * O `React.memo` do `DealCard` não ajuda aqui: o `useSortable` lê contexto, e
 * contexto passa por cima do memo — medido, o card re-renderiza ~90 vezes por
 * mousemove. Como o corpo do card depende só de `deal` e `position`, e os dois
 * são estáveis enquanto o card não muda de lugar, o memo aqui corta a subárvore
 * inteira (15 elementos, 3 ícones, 4 formatações de data e moeda) fora do
 * caminho crítico do arrasto.
 */
const DealCardView = memo(function MemoDealCardView({
  deal,
  position,
}: {
  deal: DealDTO;
  position?: number;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 flex-1 items-start gap-1.5">
          {/* O overlay do arrasto não passa posição: durante o drag ela já está obsoleta. */}
          {position === undefined ? null : (
            <span className="mt-0.5 shrink-0 text-[10px] text-zinc-400 tabular-nums">
              {position}º
            </span>
          )}
          <span
            className="line-clamp-2 font-medium text-sm text-zinc-100"
            title={deal.title}
          >
            {deal.title}
          </span>
        </span>
        <GripVertical
          aria-hidden
          className="mt-0.5 hidden shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400 md:block"
          size={14}
        />
      </div>
      <p
        className="mt-1 truncate text-xs text-zinc-400"
        title={deal.lead.companyName}
      >
        {deal.lead.companyName}
      </p>
      <p className="truncate text-xs text-zinc-400">{deal.lead.fullName}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate font-semibold text-orange-300 text-sm">
          {formatCurrency(deal.value)}
        </span>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 font-semibold text-[9px] text-orange-300"
          title={`Responsável: ${deal.responsible.name}`}
        >
          {initialsOf(deal.responsible.name)}
        </span>
      </div>

      <p
        className="mt-2 flex items-center gap-1 whitespace-nowrap text-[11px] text-zinc-400"
        title={`Criado em ${formatFullDate(deal.createdAt)}`}
      >
        <CalendarDays aria-hidden size={11} />
        Criado {formatCreatedAt(deal.createdAt)}
      </p>
      {deal.expectedCloseDate ? (
        <p
          className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] text-zinc-400"
          title={`Fechamento previsto em ${formatExpectedCloseDate(deal.expectedCloseDate)}`}
        >
          <CalendarClock aria-hidden size={11} />
          Prev. {formatExpectedCloseDate(deal.expectedCloseDate)}
        </p>
      ) : null}
    </>
  );
});

export default DealsKanbanPage;
