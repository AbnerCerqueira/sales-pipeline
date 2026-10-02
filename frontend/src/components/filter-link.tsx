import type { ComponentProps, MouseEvent } from "react";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useUrlFilters } from "../hooks/use-url-filters.ts";
import { type FilterPatch, filterHref } from "../lib/url-filters.ts";

type FilterLinkProps = Omit<ComponentProps<typeof Link>, "to"> & {
  /** Params a mesclar/limpar; `null` ou "" remove o param. */
  patch: FilterPatch;
  /** Query da página de destino, quando o link preserva os filtros ativos. */
  current?: URLSearchParams;
  /** Rota de destino. */
  to: string;
};

/**
 * Link de navegação por filtro.
 *
 * Existe para centralizar a regra que o `pushFilter` já aplica: um link para a
 * URL que já está na tela não navega (empilharia uma entrada igual, e o voltar
 * não mudaria nada), e uma navegação de verdade marca a origem da entrada para
 * o próximo commit de busca recomeçar com PUSH. `<Link>` direto nesses casos é
 * o que deixa essa marca de fora — e é o furo que o `onClick` opcional
 * reintroduziria.
 */
function FilterLink({ current, patch, to, ...linkProps }: FilterLinkProps) {
  const { onFilterLinkClick } = useUrlFilters();
  const href = filterHref(to, patch, current);
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => onFilterLinkClick(event, href),
    [href, onFilterLinkClick]
  );

  return <Link {...linkProps} onClick={handleClick} to={href} />;
}

export type { FilterLinkProps };
export { FilterLink };
