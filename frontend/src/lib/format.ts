/**
 * Fuso de exibição do projeto — a única definição desse valor no stack.
 *
 * O backend e o banco trabalham em UTC (instantes em `timestamptz`, DTO em ISO
 * com `Z`), então nada mais precisa saber de fuso. Ver
 * `docs/adr/fundacao/010-fuso-unico-utc.md`.
 */
const TIMEZONE = "America/Sao_Paulo";

/** `expectedCloseDate` é data de calendário ancorada em meia-noite UTC. */
const CALENDAR_DAY = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: TIMEZONE,
  year: "numeric",
});

const CURRENCY = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const CLOSE_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

const FULL_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "long",
  timeZone: TIMEZONE,
  year: "numeric",
});

const LONG_DATE = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: TIMEZONE,
  year: "numeric",
});

const ONE_DAY_MS = 86_400_000;

export function formatCurrency(value: number | null): string {
  return value === null ? "—" : CURRENCY.format(value);
}

export function formatExpectedCloseDate(value: string): string {
  return CLOSE_DATE.format(new Date(value));
}

export function formatFullDate(value: string): string {
  return FULL_DATE.format(new Date(value));
}

export function formatCreatedAt(value: string, now: Date = new Date()): string {
  const createdAt = new Date(value);

  if (CALENDAR_DAY.format(createdAt) === CALENDAR_DAY.format(now)) {
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

  const yesterday = new Date(now.getTime() - ONE_DAY_MS);
  if (CALENDAR_DAY.format(createdAt) === CALENDAR_DAY.format(yesterday)) {
    return "ontem";
  }

  return LONG_DATE.format(createdAt);
}
