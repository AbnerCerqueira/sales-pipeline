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

const LONG_DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const FULL_DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatFullDate(value: string | Date): string {
  return FULL_DATE_FORMAT.format(new Date(value));
}

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
