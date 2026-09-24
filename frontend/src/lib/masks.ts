const NON_DIGITS = /\D/g;
const MAX_DIGITS = 11;
const MAX_CURRENCY_DIGITS = 12;
const INTEGER_DIGITS_WITH_THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;
const LEADING_ZEROS = /^0+(?=\d)/;
const THOUSANDS_SEPARATOR = /\./g;
const TRAILING_SEPARATOR = /[.,]$/;
const CURRENCY_NUMBER = /^\d+(\.\d{1,2})?$/;
const COMMA = ",";

export function formatWhatsApp(value: string): string {
  let digits = value.replace(NON_DIGITS, "");

  if (digits.length > MAX_DIGITS && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, MAX_DIGITS);

  if (digits.length === 0) {
    return "";
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const BRAZIL_COUNTRY_CODE = "55";

export function whatsappHref(value: string): string | null {
  let digits = value.replace(NON_DIGITS, "");
  if (digits.length === 0) {
    return null;
  }
  if (!(digits.length > MAX_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE))) {
    digits = `${BRAZIL_COUNTRY_CODE}${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export function formatCurrency(value: string): string {
  const digits = value.replace(NON_DIGITS, "").slice(0, MAX_CURRENCY_DIGITS);
  if (!digits) {
    return "";
  }

  const padded = digits.padStart(3, "0");
  const integerDigits = padded.slice(0, -2).replace(LEADING_ZEROS, "");
  const decimalDigits = padded.slice(-2);
  const integer = (integerDigits || "0").replace(
    INTEGER_DIGITS_WITH_THOUSANDS,
    "."
  );

  return `${integer}${COMMA}${decimalDigits}`;
}

export function nextCurrencyValue(
  previous: string,
  input: string,
  isDelete: boolean
): string {
  if (input === "") {
    return "";
  }

  if (
    isDelete &&
    input.length < previous.length &&
    previous.startsWith(input)
  ) {
    const digits = previous.replace(NON_DIGITS, "").slice(0, -1);
    if (!digits) {
      return "";
    }

    const next = formatCurrency(digits);
    if (next === previous) {
      return "";
    }

    return next;
  }

  return formatCurrency(input);
}

export function parseCurrency(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const normalized = value
    .replace(THOUSANDS_SEPARATOR, "")
    .replace(COMMA, ".")
    .replace(TRAILING_SEPARATOR, "");
  if (!CURRENCY_NUMBER.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
