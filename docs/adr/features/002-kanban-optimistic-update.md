# ADR-002: Kanban de deals com optimistic update

**Status**: Aceito

## Contexto

O kanban é a interface central do pipeline de vendas: o vendedor arrasta cards entre colunas (`open → negotiating → won/lost`) e espera que a mudança aconteça na hora. Duas abordagens eram possíveis:

- **Pessimista**: esperar o `PATCH /deal/:id` responder antes de mover o card. Se a rede demorar 300ms, o card "gruda" na coluna antiga e o usuário clica de novo — sensação de app lento numa ação que deveria ser instantânea.
- **Optimistic**: mover o card imediatamente na UI e confirmar/reverter com o resultado do servidor.

O kanban não impõe uma máquina de estados: qualquer status pode ir para qualquer outro, inclusive reabrir um negócio fechado. A motivação é prática — arrastar errado é um caso de uso real, e um vendedor precisa conseguir corrigir um card movido para `won` por engano sem que a API bloqueie a correção.

### Listagem sem paginação

`GET /deal/search` retorna um array completo, sem `page`/`pageSize` — diferente do padrão de `PaginatedResult` (features/ADR-001). No kanban, paginação esconde cards: um deal na página 2 simplesmente não aparece na coluna, e o vendedor trabalha com uma visão incompleta do pipeline. Filtros opcionais (`responsibleId`, `status`, `title`) atendem busca e visão por vendedor sem quebrar a completude do board. Na escala atual (time de vendas pequeno, centenas de deals), carregar tudo é mais barato e mais simples do que paginar por coluna.

## Decisão

O kanban usa **optimistic update** via React Query:

1. No `onMutate`, o cache da query é atualizado com o novo status antes de a resposta chegar (o card move na hora).
2. Em erro, o cache é revertido com o snapshot capturado no `onMutate` e o toast informa o usuário.
3. Em sucesso, o cache é sincronizado com o `DealDTO` retornado.

O backend continua sendo a fonte de verdade: o `UpdateDealUseCase` valida a existência do deal e do responsável, e o repository persiste. O otimismo é UX, não regra de negócio.

`PATCH` com `status` igual ao atual é idempotente (no-op válido).

### Sincronização entre vendedores

Com mais de um vendedor no board, a invalidação do React Query só cobre mutações do próprio cliente: a tela de quem está com a aba aberta ficava com dado velho até um F5. Três opções:

- **Não atualizar**: custo zero, mas quem já está no board nunca vê a mudança do colega.
- **SSE/WebSocket**: tempo real de verdade, mas exige infra nova no backend (plugin Fastify, endpoint, reconexão/heartbeat) e um cliente com fallback — desproporcional para a escala atual.
- **Polling**: uma opção no hook que já existe.

Escolha: **polling de 10s** (`refetchInterval` no `useDealsQuery`), pausado enquanto o vendedor está no meio de uma ação local (arrasto, modal de edição ou `PATCH` pendente) — um refetch caindo no meio do drop sobrescreveria o patch otimista antes de o `onMutate` cancelar o que já está em voo. O React Query já não refetcha com a aba oculta (default de `refetchIntervalInBackground`), então o custo real se resume à janela em que alguém está olhando o board.

## Consequências

- **Aceito**: janela pequena de UI temporariamente divergente do banco. Se a request falhar, rollback + toast — o usuário vê o erro e o card volta.
- **Aceito**: até 10s de latência para refletir edição de outro vendedor. Como cada tentativa falha do polling gera um `Error` novo, `useErrorToast` deduplica por mensagem: um toast enquanto o erro persiste, sem repetir a cada ciclo.
- **Evita**: lock de linha ou constraint de versão (optimistic locking com `version`). Na escala atual, conflito de escrita no mesmo deal é raríssimo.
- **Futuro**: o polling cobre a escala atual; se a latência de até 10s virar problema, SSE/WebSocket é a evolução natural, não uma reescrita. Para conflito de escrita no mesmo deal (dois vendedores editando ao mesmo tempo), optimistic locking (`version` no deal + `409` no PATCH) segue sendo o caminho se o cenário aparecer.
- **Aceito perder proteção de workflow**: o status é coluna visual do pipeline, não etapa travada de um fluxo. Se no futuro o negócio exigir que `won` seja imutável (ex: auditoria de comissão), aí vira um ADR próprio com a regra explícita.
