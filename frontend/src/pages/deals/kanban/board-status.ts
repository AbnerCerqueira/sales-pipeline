/** Primeiro load, erro, vazio com filtro e vazio sem filtro são leituras distintas. */
export type BoardStatus = "empty" | "error" | "filtered" | "loading" | "ready";

/**
 * Deriva o que o board mostra a partir do estado da query.
 *
 * Separado do componente porque é a decisão que impede o board inteiro de
 * cair: um `refetch` de background que falha não pode virar a tela de erro.
 */
export function resolveBoardStatus(
  isPending: boolean,
  isError: boolean,
  count: number,
  hasActiveFilters: boolean
): BoardStatus {
  if (isPending) {
    return "loading";
  }
  // O React Query mantém `data` quando um refetch de background falha: sem esta
  // guarda, um único poll malsucedido derrubaria o board inteiro a cada 10s.
  if (isError && count === 0) {
    return "error";
  }
  if (count > 0) {
    return "ready";
  }
  return hasActiveFilters ? "filtered" : "empty";
}
