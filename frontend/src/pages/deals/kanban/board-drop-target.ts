import {
  type CollisionDetection,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import type { DealStatus } from "@sales/shared";
import type { Virtualizer } from "@tanstack/react-virtual";
import {
  DEAL_COLUMNS,
  type PlaceholderShift,
  shiftAfter,
} from "./board-model.ts";

/** Colunas são droppable com id = status; cards usam o próprio id. */
const COLUMN_IDS = new Set<string>(DEAL_COLUMNS.map((column) => column.status));

/**
 * Card sobre a coluna, sempre.
 *
 * O `closestCenter` compara distâncias até o centro, e numa coluna alta o
 * centro fica longe do ponteiro: o mesmo drop podia resolver para a coluna
 * (card vai para o fim) ou para o card (card fica naquele slot), dependendo de
 * meio pixel. `pointerWithin` dá os candidatos pelo ponto do ponteiro, e o
 * card é sempre o mais específico deles.
 */
export const preferCardCollision: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const card = collisions.find(
    (collision) => !COLUMN_IDS.has(String(collision.id))
  );

  if (card) {
    return [card];
  }

  return collisions.length > 0 ? collisions : rectIntersection(args);
};

type ColumnVirtualizer = Virtualizer<HTMLDivElement, Element>;

/** O que cada coluna publica para o cálculo do drop, atualizado a cada render. */
export interface ColumnMeasurement {
  columnNode: HTMLDivElement | null;
  /** Ids na ordem de exibição, para reencontrar o card arrastado. */
  ids: string[];
  virtualizer: ColumnVirtualizer;
}

/**
 * Medição viva de cada coluna, por status.
 *
 * Com a lista virtualizada o `over` do dnd-kit não serve para achar a posição:
 * ele só conhece os cards montados, e `indexOf(overId)` contaria a lista sem o
 * deslocamento da lacuna. O registro entrega as medições reais para o arrasto
 * derivar o índice da coordenada do ponteiro.
 */
export type VirtualizerRegistry = Map<DealStatus, ColumnMeasurement>;

/** Coluna cujo corpo contém o ponteiro, ou `null` se ele estiver fora do board. */
export function columnAtPoint(
  registry: VirtualizerRegistry,
  x: number,
  y: number
): DealStatus | null {
  for (const { status } of DEAL_COLUMNS) {
    const node = registry.get(status)?.columnNode;
    if (!node) {
      continue;
    }
    const rect = node.getBoundingClientRect();
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      return status;
    }
  }
  return null;
}

/**
 * Traduz "o ponteiro está em Y dentro desta coluna" no índice que
 * `placeInColumn` entende: a posição do card já fora da lista.
 *
 * A lacuna não é uma linha da lista, é um deslocamento aplicado às linhas a
 * partir de `insertAt`, então ela entra no offset. Na coluna de origem o card
 * arrastado continua na lista e sai antes de ser reinserido, então o índice
 * final anda um atrás.
 */
export function dropIndexForColumn(
  registry: VirtualizerRegistry,
  status: DealStatus,
  dealId: string,
  pointerY: number,
  shift: PlaceholderShift
): number | null {
  const column = registry.get(status);
  const scrollElement = column?.virtualizer.scrollElement;
  if (!(column && scrollElement)) {
    return null;
  }

  const items = column.virtualizer.getVirtualItems();
  if (items.length === 0) {
    return 0;
  }

  const offset =
    pointerY -
    scrollElement.getBoundingClientRect().top +
    scrollElement.scrollTop;

  // Linha antes da qual o card cairia; sem match, ele vai para o fim.
  let anchor = items.length;
  for (const item of items) {
    const top = item.start + shiftAfter(shift, item.index);
    if (offset < top + item.size / 2) {
      anchor = item.index;
      break;
    }
  }
  if (anchor === items.length) {
    anchor = (items.at(-1)?.index ?? 0) + 1;
  }

  const from = column.ids.indexOf(dealId);
  return from !== -1 && anchor > from ? anchor - 1 : anchor;
}
