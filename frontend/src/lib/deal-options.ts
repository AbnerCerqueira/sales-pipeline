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
