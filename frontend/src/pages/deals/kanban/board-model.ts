import type { DealDTO, DealStatus } from "@sales/shared";

/**
 * As quatro colunas do board, na ordem em que aparecem na tela.
 *
 * Fonte única de verdade para: cores, ordem, cols de grid e cálculo de drop.
 * Um status novo entra aqui e o board inteiro acompanha.
 */
export const DEAL_COLUMNS: Array<{
  accent: string;
  dot: string;
  status: DealStatus;
}> = [
  { accent: "text-orange-400", dot: "bg-orange-400", status: "open" },
  { accent: "text-sky-400", dot: "bg-sky-400", status: "negotiating" },
  { accent: "text-emerald-400", dot: "bg-emerald-400", status: "won" },
  { accent: "text-rose-400", dot: "bg-rose-400", status: "lost" },
];

export const CARD_GAP_PX = 10;

/** Slot vago que o card arrastado abriria na coluna de destino. */
export interface Placeholder {
  index: number;
  status: DealStatus;
}

/**
 * Deslocamento que a lacuna aplica às linhas a partir de um ponto.
 *
 * A lacuna não é uma linha da lista virtualizada: é um `translateY` extra nas
 * linhas de `insertAt` em diante. Ver o comentário em `kanban-column.tsx`.
 */
export interface PlaceholderShift {
  /** Índice do card que a lacuna antecede; `null` quando não há lacuna. */
  insertAt: number | null;
  /** Altura da lacuna mais o gap. */
  pixels: number;
}

export const NO_SHIFT: PlaceholderShift = { insertAt: null, pixels: 0 };

/** Quanto a linha `index` precisa descer por causa da lacuna. */
export function shiftAfter(shift: PlaceholderShift, index: number): number {
  return shift.insertAt === null || index < shift.insertAt ? 0 : shift.pixels;
}

/** Ids em ordem de exibição, agrupados por coluna do board. */
export type BoardColumns = Record<DealStatus, string[]>;

function emptyColumns(): BoardColumns {
  return { lost: [], negotiating: [], open: [], won: [] };
}

export function buildColumns(deals: DealDTO[]): BoardColumns {
  const columns = emptyColumns();

  for (const deal of deals) {
    columns[deal.status].push(deal.id);
  }

  return columns;
}

export function findColumnOf(
  columns: BoardColumns,
  dealId: string
): DealStatus | undefined {
  return DEAL_COLUMNS.find(({ status }) => columns[status].includes(dealId))
    ?.status;
}

/** Onde o card estava quando o arrasto começou, para reconhecer um drag sem efeito. */
export function originAnchorOf(
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
 * muda — o `onDragMove` dispara a cada mousemove, e recalcular a cada pixel
 * seria trabalho jogado fora.
 */
export function placeInColumn(
  columns: BoardColumns,
  dealId: string,
  target: DealStatus,
  index: number
): BoardColumns | null {
  const from = findColumnOf(columns, dealId);
  if (!from) {
    return null;
  }

  const rest = DEAL_COLUMNS.reduce<BoardColumns>((acc, { status }) => {
    acc[status] = columns[status].filter((id) => id !== dealId);
    return acc;
  }, emptyColumns());

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

/** Referências estáveis: sem elas o `memo` da coluna não segura nada. */
export const NO_DEALS: DealDTO[] = [];
export const NO_ITEMS: string[] = [];
