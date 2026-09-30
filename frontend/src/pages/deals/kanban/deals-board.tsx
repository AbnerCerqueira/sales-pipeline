import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { DealDTO } from "@sales/shared";
import { Handshake, Plus, RefreshCw, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { ClearFiltersButton } from "../../../components/clear-filters-button.tsx";
import { Button } from "../../../components/ui/button.tsx";
import { preferCardCollision } from "./board-drop-target.ts";
import { DEAL_COLUMNS, NO_DEALS, NO_ITEMS } from "./board-model.ts";
import type { BoardStatus } from "./board-status.ts";
import { DealCardView } from "./deal-card.tsx";
import { KanbanColumn } from "./kanban-column.tsx";
import type { DealDrag } from "./use-deal-drag.ts";

interface DealsBoardProps {
  deals: DealDTO[];
  /**
   * Estado do arrasto — e a disposição que ele produziu. `columns` vem dentro
   * do objeto de propósito: quem decide o layout renderizado é o arrasto, e
   * passar os dois separados permitiria os dois divergirem.
   */
  drag: DealDrag;
  isDragDisabled: boolean;
  onClearFilters: () => void;
  onCreateDeal: () => void;
  onRetry: () => void;
  onSelect: (deal: DealDTO) => void;
  status: BoardStatus;
}

/**
 * Decide o que renderizar: skeleton, erro, vazio, ou o DndContext com as 4
 * colunas. Nenhuma dessas leituras conhece React Query — recebe só o `status`
 * já resolvido.
 */
export function DealsBoard({
  deals,
  drag,
  isDragDisabled,
  onClearFilters,
  onCreateDeal,
  onRetry,
  onSelect,
  status,
}: DealsBoardProps) {
  const {
    activeDeal,
    activeId,
    columns,
    onDragEnd,
    onDragMove,
    onDragStart,
    overColumn,
    overlayWidth,
    placeholder,
    sensors,
    slotHeightRef,
    virtualizersRef,
  } = drag;

  // Tudo memoizado: o `items` do SortableContext é copiado pelo dnd-kit para
  // configurar o ResizeObserver do useDroppable. Array novo a cada render
  // re-registra o observer, que mede, seta estado e re-renderiza — o ciclo se
  // fecha e o React reclama de "maximum update depth".
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
      onDragCancel={drag.cancelDrag}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DEAL_COLUMNS.map(({ status: columnStatus, dot, accent }) => (
          <KanbanColumn
            accent={accent}
            activeId={activeId}
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
            slotHeightRef={slotHeightRef}
            status={columnStatus}
            virtualizersRef={virtualizersRef}
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
