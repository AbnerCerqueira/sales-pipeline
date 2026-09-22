export function fieldBorder(error?: string) {
  if (error) {
    return "border-red-500/60 hover:bg-zinc-900 focus:border-red-400 focus:bg-zinc-900 focus:ring-2 focus:ring-red-500/15";
  }
  return "border-zinc-800 hover:bg-zinc-900 focus:border-orange-500/60 focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500/15";
}
