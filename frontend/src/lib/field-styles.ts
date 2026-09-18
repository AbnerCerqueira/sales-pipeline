export function fieldBorder(error?: string) {
  return error
    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
    : "border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500";
}
