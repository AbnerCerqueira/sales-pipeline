/**
 * Reinsere `dealId` em `ids` logo após `afterDealId`.
 *
 * O ranking do board é uma âncora (o id do card vizinho) e não um índice: com
 * filtros ativos o "3º card visível" não corresponde a nada no ranking real,
 * mas a âncora é sempre um id que existe. `afterDealId` nulo significa topo.
 *
 * Âncora ausente (outro vendedor moveu o card entre a leitura e o drop) cai no
 * topo: o próximo refetch do polling reesincroniza de qualquer forma.
 */
export function reorderDealIds(
  ids: string[],
  dealId: string,
  afterDealId: string | null
): string[] {
  const rest = ids.filter((id) => id !== dealId);
  const anchorIndex = afterDealId
    ? rest.indexOf(afterDealId)
    : /* Sem âncora: topo. */ -1;
  const insertAt = anchorIndex === -1 ? 0 : anchorIndex + 1;

  return [...rest.slice(0, insertAt), dealId, ...rest.slice(insertAt)];
}
