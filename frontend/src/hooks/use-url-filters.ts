import type { MouseEvent } from "react";
import { useCallback, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from "react-router-dom";
import { applyFilterPatch, type FilterPatch } from "../lib/url-filters.ts";

/**
 * Origem da entrada atual do histórico: decide push vs replace na busca.
 *
 * Módulo, não hook: `<FilterLink>` chama `useUrlFilters()` para o guard, e o
 * ref precisa ser o mesmo que o `commitSearch` da página lê — por instância
 * cada um marcaria um ref que o outro não enxerga. É estado de navegação, não
 * de componente, e cada aba do browser tem seu próprio contexto JS.
 */
const originRef: { current: "search" | "filter" | null } = { current: null };

/**
 * Filtros como estado de navegação: a URL é a fonte de verdade.
 *
 * - `pushFilter`/`replaceFilter`: mudança discreta (seleção, página, limpar) —
 *   `replaceFilter` é o mesmo patch sem entrada no histórico, para normalizar
 *   um estado órfão (ex.: página além do total).
 * - `commitSearch`: texto digitado (já debounced) → PUSH na primeira commit da
 *   sessão e REPLACE nas seguintes (coalescing) — uma pausa no meio da
 *   digitação não empilha histórico. O modo "search" reseta em POP.
 * - `onFilterLinkClick`: guard para `<FilterLink>`, que navega por `<Link>`
 *   (fora do `pushFilter`) e precisa da mesma regra de "URL igual não navega".
 */
export function useUrlFilters() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  // Voltar/avançar volta a uma entrada antiga: a próxima busca recomeça com
  // push em vez de sobrescrever a entrada atual.
  // biome-ignore lint/correctness/useExhaustiveDependencies: location.key força o reset a cada navegação; dois POPs seguidos não mudam navigationType.
  useEffect(() => {
    if (navigationType === "POP") {
      originRef.current = null;
    }
  }, [location.key, navigationType]);

  // Devolve `true` quando navegou de fato, para o origin só ser marcado nesse
  // caso: um patch redundante (reselecionar o filtro já ativo) não pode
  // reabrir a sessão de busca e transformar o próximo commit em PUSH.
  const write = useCallback(
    (patch: FilterPatch, replace: boolean): boolean => {
      const current = searchParams.toString();
      const query = applyFilterPatch(searchParams, patch).toString();
      // Patch que não muda a URL (ex.: reselecionar o filtro já ativo) não
      // navega: empilharia uma entrada igual e o voltar não mudaria a tela.
      if (query === current) {
        return false;
      }
      // Query vazia não pode virar "?": navigate sem search deixa a URL limpa.
      navigate(query ? `${location.pathname}?${query}` : location.pathname, {
        replace,
      });
      return true;
    },
    [location.pathname, navigate, searchParams]
  );

  const pushFilter = useCallback(
    (patch: FilterPatch) => {
      if (write(patch, false)) {
        originRef.current = "filter";
      }
    },
    [write]
  );

  const replaceFilter = useCallback(
    (patch: FilterPatch) => {
      if (write(patch, true)) {
        originRef.current = "filter";
      }
    },
    [write]
  );

  const commitSearch = useCallback(
    (patch: FilterPatch) => {
      const replace = originRef.current === "search";
      if (write(patch, replace)) {
        originRef.current = "search";
      }
    },
    [write]
  );

  // Navegação feita por `<Link>` não passa pelo `pushFilter`: o guard abaixo
  // marca a origem para o próximo commit de busca recomeçar com PUSH, sem
  // sobrescrever a entrada que o link acabou de criar.
  const onFilterLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      // Modificador (ctrl/cmd/shift/alt): abrir aba/janela nova é do
      // navegador, e o histórico dessa navegação não é nosso.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const [pathname, search = ""] = href.split("?");
      if (
        pathname === location.pathname &&
        search === searchParams.toString()
      ) {
        event.preventDefault();
        return;
      }
      originRef.current = "filter";
    },
    [location.pathname, searchParams]
  );

  return {
    commitSearch,
    onFilterLinkClick,
    pushFilter,
    replaceFilter,
    searchParams,
  };
}
