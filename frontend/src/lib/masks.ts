const NON_DIGITS = /\D/g;
const MAX_DIGITS = 11;

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
