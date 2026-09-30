import {
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DealDTO, DealStatus } from "@sales/shared";
import type { MutableRefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { useMoveDealMutation } from "../../../hooks/use-deals.ts";
import {
  columnAtPoint,
  dropIndexForColumn,
  type VirtualizerRegistry,
} from "./board-drop-target.ts";
import {
  type BoardColumns,
  buildColumns,
  CARD_GAP_PX,
  findColumnOf,
  NO_SHIFT,
  originAnchorOf,
  type Placeholder,
  placeInColumn,
} from "./board-model.ts";

type MoveDealMutation = ReturnType<typeof useMoveDealMutation>;

type DndSensors = ReturnType<typeof useSensors>;

/**
 * Tudo que o board precisa saber sobre o arrasto, num objeto só.
 *
 * `columns` mora aqui (e não na página) porque é a mesma pergunta que o
 * arrasto responde: qual disposição o board mostra agora?
 */
export interface DealDrag {
  /** Card sob o cursor, como o board o está renderizando. */
  activeDeal: DealDTO | null;
  activeId: string | null;
  cancelDrag: () => void;
  columns: BoardColumns;
  onDragEnd: (event: DragEndEvent) => void;
  onDragMove: (event: DragMoveEvent) => void;
  onDragStart: (event: DragStartEvent) => void;
  /** Coluna que receberia o card se ele fosse solto agora. */
  overColumn: DealStatus | null;
  overlayWidth: number | undefined;
  placeholder: Placeholder | null;
  sensors: DndSensors;
  slotHeightRef: MutableRefObject<number>;
  virtualizersRef: MutableRefObject<VirtualizerRegistry>;
}

interface UseDealDragOptions {
  /** A lista exatamente como o board a renderiza (já com os patches otimistas). */
  deals: DealDTO[];
  moveDeal: MoveDealMutation;
  /**
   * A página pausa o polling enquanto há arrasto, mas a query precisa dessa
   * resposta antes de devolver a lista que este hook consome — daí o espelho em
   * vez de ler `activeId` daqui.
   */
  onDraggingChange: (dragging: boolean) => void;
}

/**
 * Orquestra o arrasto: onde o card está, onde ele cairia, e a disposição
 * mostrada pelo board enquanto o servidor não responde.
 *
 * A ideia que resume o módulo: **durante o arrasto a lista renderizada não
 * muda**. O `onDragMove` só descreve, num ref, para onde o card iria — quem
 * reordena a lista é o `onDragEnd`, uma vez por arrasto. Ver o comentário longo
 * em `handleDragMove` para o número que motivou isso.
 */
export function useDealDrag({
  deals,
  moveDeal,
  onDraggingChange,
}: UseDealDragOptions): DealDrag {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Disposição final, do instante em que o card é solto até o servidor
  // responder. Durante o arrasto a lista renderizada NÃO muda: ver
  // `handleDragMove` para o porquê. `null` = nada aguardando o servidor.
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
  // Medição viva de cada coluna, publicada pelas próprias `KanbanColumn`.
  const virtualizersRef = useRef<VirtualizerRegistry>(new Map());
  // `onDragMove` roda a cada mousemove e é `useCallback` sem deps: o que ele
  // precisa ler do evento tem que chegar por ref.
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  // Espelho do `targetSlot` para o `onDragMove` ler a lacuna que está na tela.
  const targetSlotRef = useRef<Placeholder | null>(null);
  // Altura da lacuna, medida e publicada pela coluna que a desenha.
  const slotHeightRef = useRef(0);
  // `capture` para rodar antes do dnd-kit: se o handler dele ler a ref antes
  // desta atualizar, o índice sai de um mousemove atrás.
  const trackPointer = useCallback((event: globalThis.MouseEvent) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  // Só mouse: sem sensor de toque a rolagem vertical no mobile não vira arrasto.
  // Referência estável entre renders — recriá-la remontaria os sensores no meio do arrasto.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } })
  );

  const clearDragState = useCallback(() => {
    window.removeEventListener("mousemove", trackPointer, true);
    pointerRef.current = null;
    dragColumnsRef.current = null;
    originColumnsRef.current = null;
    setActiveId(null);
    setOverlayWidth(undefined);
    targetSlotRef.current = null;
    setOverColumn(null);
    setTargetSlot(null);
    onDraggingChange(false);
  }, [onDraggingChange, trackPointer]);

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
      onDraggingChange(true);
      // Nada de reservar slot na origem: o card continua na lista, só
      // invisível (`isDragging` → opacity-0), e o dnd-kit desliza os irmãos em
      // volta dele. É o comportamento nativo dele, e é o que mantém a lista
      // renderizada imóvel durante todo o arrasto.
      setTargetSlot(null);
      // Overlay é position: fixed; sem congelar a largura ele "pula" ao arrastar.
      setOverlayWidth(event.active.rect.current.initial?.width);
      window.addEventListener("mousemove", trackPointer, true);
    },
    [deals, onDraggingChange, trackPointer]
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
   *
   * É `onDragMove` e não `onDragOver` porque aqui a posição vem da geometria da
   * lista, e não do `over`: o `onDragOver` do dnd-kit só dispara quando o `over`
   * muda (o efeito dele depende de `[overId]`), então mover o ponteiro dentro do
   * mesmo card não atualizaria a posição. `onDragMove` dispara a cada mousemove.
   */
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const dealId = event.active.id;
    const pointer = pointerRef.current;
    const { current } = dragColumnsRef;
    if (typeof dealId !== "string" || !pointer || !current) {
      return;
    }

    // Fora do board não há destino: a última posição válida fica valendo.
    const targetColumn = columnAtPoint(
      virtualizersRef.current,
      pointer.x,
      pointer.y
    );
    if (!targetColumn) {
      return;
    }

    // O deslocamento que está na tela agora é o do slot da iteração anterior:
    // é contra ele que o ponteiro precisa ser medido.
    const drawn = targetSlotRef.current;
    const shift =
      drawn !== null && drawn.status === targetColumn
        ? {
            insertAt: drawn.index,
            pixels: slotHeightRef.current + CARD_GAP_PX,
          }
        : NO_SHIFT;
    const index = dropIndexForColumn(
      virtualizersRef.current,
      targetColumn,
      dealId,
      pointer.y,
      shift
    );
    if (index === null) {
      return;
    }

    const next = placeInColumn(current, dealId, targetColumn, index);
    if (!next) {
      return;
    }

    dragColumnsRef.current = next;
    const landed = findColumnOf(next, dealId);
    if (!landed) {
      return;
    }

    setOverColumn(landed);

    // A lacuna só é desenhada quando o card vem de outra coluna. Dentro da
    // própria coluna quem abre espaço é o transform do dnd-kit; desenhar o
    // slot aqui duplicaria o card.
    const slot = next[landed].indexOf(dealId);
    targetSlotRef.current = { index: slot, status: landed };
    setTargetSlot((prev) =>
      prev !== null && prev.status === landed && prev.index === slot
        ? prev
        : { index: slot, status: landed }
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

      // A coluna final e a posição dentro dela já são a resposta: o onDragMove
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

  // O `??` é o único ponto do fluxo que decide a disposição renderizada: a
  // espera pelo servidor tem prioridade sobre o que veio da query.
  // Memoizado porque `columns` vira `items` do `SortableContext` — array novo a
  // cada render reabre o ciclo de remedição do dnd-kit.
  const columns = useMemo(
    () => settledColumns ?? buildColumns(deals),
    [deals, settledColumns]
  );
  const activeDeal =
    activeId === null
      ? null
      : (deals.find((deal) => deal.id === activeId) ?? null);

  return {
    activeDeal,
    activeId,
    cancelDrag,
    columns,
    onDragEnd: handleDragEnd,
    onDragMove: handleDragMove,
    onDragStart: handleDragStart,
    overColumn,
    overlayWidth,
    placeholder: targetSlot,
    sensors,
    slotHeightRef,
    virtualizersRef,
  };
}
