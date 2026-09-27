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

const LEAD_SOURCE_BADGE_CLASSES: Record<LeadSource, string> = {
  inbound: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  other: "border-zinc-700/60 bg-zinc-800/60 text-zinc-300",
  outbound: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  referral: "border-sky-500/25 bg-sky-500/10 text-sky-300",
};

export function leadSourceBadgeClass(source: LeadSource): string {
  return LEAD_SOURCE_BADGE_CLASSES[source] ?? LEAD_SOURCE_BADGE_CLASSES.other;
}
