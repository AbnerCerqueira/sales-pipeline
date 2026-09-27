import type { DealStatus } from "@sales/shared";

export const DEAL_STATUS_OPTIONS: Array<{
  label: string;
  value: DealStatus;
}> = [
  { label: "Aberto", value: "open" },
  { label: "Em negociação", value: "negotiating" },
  { label: "Ganho", value: "won" },
  { label: "Perdido", value: "lost" },
];

export function formatDealStatus(status: DealStatus): string {
  return (
    DEAL_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

// Montado uma vez no módulo: `toLocaleString` reconstrói o formatter da
// locale a cada chamada, e a coluna soma o total de todos os cards a cada
// render. É o mesmo motivo de `CLOSE_DATE_FORMAT` aqui embaixo.
const DEAL_VALUE_FORMAT = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export function formatDealValue(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return DEAL_VALUE_FORMAT.format(value);
}

const CLOSE_DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatExpectedCloseDate(value: string): string {
  // `new Date("2026-01-30")` é interpretado como UTC e exibiria o dia anterior
  // em fusos negativos; o construtor com números monta a data no fuso local.
  const [year, month, day] = value.split("-").map(Number);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return value;
  }

  return CLOSE_DATE_FORMAT.format(new Date(year, month - 1, day));
}
