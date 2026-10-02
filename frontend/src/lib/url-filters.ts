import { z } from "zod";

/** Patch de params da URL: `null` ou string vazia remove o param. */
export type FilterPatch = Record<string, string | null>;

export function applyFilterPatch(
  current: URLSearchParams,
  patch: FilterPatch
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next;
}

/**
 * Href de navegação com filtros, para `<Link>`: mesmo merge/limpeza do
 * `pushFilter` (o `current` é a query da página de destino, quando o link
 * mantém os filtros já ativos), só que como link em vez de escrita na URL.
 */
export function filterHref(
  pathname: string,
  patch: FilterPatch,
  current?: URLSearchParams
): string {
  const query = applyFilterPatch(current ?? new URLSearchParams(), patch);
  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * Lê texto da URL. Ausente/vazio = string vazia.
 *
 * `max` espelha o limite do schema da API: a URL é editável à mão e o
 * param também vem de link colado, então um termo maior é truncado aqui em vez
 * de virar 400 na busca — o input mostra o mesmo texto truncado que o filtro
 * aplicou, sem param morto na URL.
 */
export function readText(
  params: URLSearchParams,
  key: string,
  max: number
): string {
  const value = params.get(key)?.trim() ?? "";
  return value.slice(0, max);
}

/** Só aceita uuid — valor quebrado vira ausente sem derrubar os outros params. */
export function readUuid(params: URLSearchParams, key: string): string {
  const value = params.get(key)?.trim() ?? "";
  return z.uuid().safeParse(value).success ? value : "";
}

/** Página >= 1 e representável; inválido = 1. `page=1` é omitido da URL. */
export function readPage(params: URLSearchParams, key = "page"): number {
  const raw = Number(params.get(key));
  return Number.isSafeInteger(raw) && raw >= 1 ? raw : 1;
}
