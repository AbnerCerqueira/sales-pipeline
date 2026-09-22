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

const LONG_DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatCreatedAt(
  value: string | Date,
  now: Date = new Date()
): string {
  const createdAt = new Date(value);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (createdAt >= todayStart) {
    const diffMinutes = Math.floor(
      (now.getTime() - createdAt.getTime()) / 60_000
    );
    if (diffMinutes < 1) {
      return "agora";
    }
    if (diffMinutes < 60) {
      return `há ${diffMinutes} min`;
    }
    const hours = Math.floor(diffMinutes / 60);
    return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  if (createdAt >= yesterdayStart) {
    return "ontem";
  }

  return LONG_DATE_FORMAT.format(createdAt);
}
