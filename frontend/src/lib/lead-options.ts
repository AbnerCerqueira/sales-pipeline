import type { LeadSource } from "@sales/shared";

export const LEAD_SOURCE_OPTIONS: Array<{ label: string; value: LeadSource }> =
  [
    { label: "Indicação", value: "referral" },
    { label: "Inbound", value: "inbound" },
    { label: "Outbound", value: "outbound" },
    { label: "Outro", value: "other" },
  ];

export function formatLeadSource(source: LeadSource): string {
  return (
    LEAD_SOURCE_OPTIONS.find((option) => option.value === source)?.label ??
    source
  );
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
