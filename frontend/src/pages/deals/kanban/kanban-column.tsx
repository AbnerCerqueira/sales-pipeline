import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { DealDTO, DealStatus } from "@sales/shared";
import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range as VirtualRange,
} from "@tanstack/react-virtual";
import type { MutableRefObject } from "react";
import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatDealStatus } from "../../../lib/deal-options.ts";
import { formatCurrency } from "../../../lib/format.ts";
import type { VirtualizerRegistry } from "./board-drop-target.ts";
import {
  CARD_GAP_PX,
  type Placeholder,
  type PlaceholderShift,
  shiftAfter,
} from "./board-model.ts";
import { CARD_SHELL, DealCard, DealCardView } from "./deal-card.tsx";

/**
 * Altura média real de um card (medida em ~580 deals: min 143, média 161, max
 * 183). Estimar abaixo da média faz a altura da coluna crescer conforme o
 * usuário rola, e a barra de rolagem "escorrega" sob o ponteiro.
 */
const CARD_ESTIMATED_HEIGHT_PX = 161;
const COLUMN_PADDING_PX = 12;

export const KanbanColumn = memo(function MemoKanbanColumn({
  accent,
  activeId,
  deals,
  dot,
  isDragDisabled,
  isDropTarget,
  items,
  onSelect,
  placeholder,
  placeholderDeal,
  slotHeightRef,
  status,
  virtualizersRef,
}: {
  accent: string;
  activeId: string | null;
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
  slotHeightRef: MutableRefObject<number>;
  status: DealStatus;
  virtualizersRef: MutableRefObject<VirtualizerRegistry>;
}) {
  const { setNodeRef } = useDroppable({ data: { status }, id: status });
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnNodeRef = useRef<HTMLDivElement | null>(null);
  // A lacuna é um card invisível com a altura do card arrastado; sem medir, o
  // deslocamento das linhas de baixo seria um palpite e a coluna saltaria.
  const [slotHeight, setSlotHeight] = useState(0);
  const measureSlot = useCallback(
    (node: HTMLDivElement | null) => {
      const height = node?.getBoundingClientRect().height ?? 0;
      slotHeightRef.current = height;
      setSlotHeight((prev) => (prev === height ? prev : height));
    },
    [slotHeightRef]
  );
  const setColumnNode = useCallback(
    (node: HTMLDivElement | null) => {
      columnNodeRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const activeRowIndex = useMemo(
    () =>
      activeId === null ? -1 : deals.findIndex((deal) => deal.id === activeId),
    [activeId, deals]
  );

  // O card arrastado tem de continuar no DOM mesmo se a coluna rolar até ele
  // sair da janela: o `useSortable` dele é o que sustenta o arrasto, e o nó
  // reserva o espaço onde o overlay vai pousar.
  const rangeExtractor = useCallback(
    (range: VirtualRange) => {
      const base = defaultRangeExtractor(range);
      return activeRowIndex === -1
        ? base
        : [...new Set([...base, activeRowIndex])].sort((a, b) => a - b);
    },
    [activeRowIndex]
  );

  // O cache de altura do virtualizador é chaveado por `getItemKey`. Indexado por
  // posição, mover ou remover um card desloca todo o resto e cada índice passa a
  // descrever outro card — os que estão fora da janela não são remedidos, e a
  // coluna fica com buracos e cards sobrepostos. Chaveando pelo id, a medição
  // acompanha o card.
  const getItemKey = useCallback(
    (index: number) => deals[index]?.id ?? index,
    [deals]
  );

  const columnVirtualizer = useVirtualizer<HTMLDivElement, Element>({
    count: deals.length,
    estimateSize: () => CARD_ESTIMATED_HEIGHT_PX,
    gap: CARD_GAP_PX,
    getItemKey,
    getScrollElement: () => scrollRef.current,
    overscan: 6,
    paddingEnd: COLUMN_PADDING_PX,
    paddingStart: COLUMN_PADDING_PX,
    rangeExtractor,
  });

  /*
   * A lacuna NÃO entra na lista virtualizada. Inserir uma linha nela deslocaria
   * o índice de todos os cards abaixo, e o cache de medição do virtualizador é
   * indexado por posição: o tamanho medido passaria a descrever outro card, e o
   * que está fora da janela nunca é remedido. O resultado é a coluna com altura
   * errada e cards se sobrepondo. Então a lista é sempre a mesma — card no
   * índice i é sempre o mesmo card — e a lacuna é só um deslocamento.
   */
  const insertAt = placeholder?.index ?? null;
  const shiftPixels = insertAt === null ? 0 : slotHeight + CARD_GAP_PX;
  const shift: PlaceholderShift = { insertAt, pixels: shiftPixels };

  // `useLayoutEffect` e não `useEffect`: o `onDragMove` lê este registro no
  // evento seguinte, e um efeito passivo chegaria tarde com a lista anterior.
  useLayoutEffect(() => {
    virtualizersRef.current.set(status, {
      columnNode: columnNodeRef.current,
      ids: items,
      virtualizer: columnVirtualizer,
    });
  }, [columnVirtualizer, items, status, virtualizersRef]);

  const virtualRows = columnVirtualizer.getVirtualItems();

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-zinc-900/40 transition-colors ${
        isDropTarget
          ? "border-orange-500/50 ring-2 ring-orange-500/20"
          : "border-zinc-800/80"
      }`}
      data-status={status}
      ref={setColumnNode}
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

      {/*
        Cada coluna é o próprio scroller em todo breakpoint. Com a lista
        virtualizada a janela precisa de um elemento de scroll conhecido, e a
        página inteira não serve: a medição de cada linha é relativa a ele.
      */}
      <div
        className="max-h-[62vh] min-h-28 flex-1 overflow-y-auto"
        ref={scrollRef}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div
            className="relative px-3"
            style={{ height: columnVirtualizer.getTotalSize() + shiftPixels }}
          >
            {virtualRows.map((virtualRow) => {
              const deal = deals[virtualRow.index];
              if (!deal) {
                return null;
              }
              return (
                <div
                  data-index={virtualRow.index}
                  key={deal.id}
                  ref={columnVirtualizer.measureElement}
                  style={{
                    left: 0,
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start + shiftAfter(shift, virtualRow.index)}px)`,
                    width: "100%",
                  }}
                >
                  <DealCard
                    deal={deal}
                    disabled={isDragDisabled}
                    onSelect={onSelect}
                    position={virtualRow.index + 1}
                  />
                </div>
              );
            })}
            {insertAt !== null && placeholderDeal !== null ? (
              // Sem altura fixada: a lacuna é medida pelo próprio conteúdo. Com
              // `h-full` dentro de um pai cuja altura vem da medição, o
              // resultado é 0 e o deslocamento some.
              <div
                className="absolute top-0 left-0 w-full"
                ref={measureSlot}
                style={{
                  transform: `translateY(${columnVirtualizer.getVirtualItems().find((i) => i.index === insertAt)?.start ?? columnVirtualizer.getTotalSize()}px)`,
                }}
              >
                <PlaceholderSlot deal={placeholderDeal} />
              </div>
            ) : null}
          </div>
        </SortableContext>
        {deals.length === 0 ? (
          <div className="px-3 pb-3">
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
