# ADR-003: Ordem manual no kanban

**Status**: Aceito

## Contexto

O kanban ordenava os cards por `createdAt DESC`, fixo no banco (`drizzle-deal-repository.ts`). Não era escolha de produto: era o que existia, e arrastar um card nunca podia mudar a ordem porque a posição **não era dado** — a tabela `deals` não tinha coluna que a representasse.

Três consequências que apareceram no uso:

1. **O card "ordenava sozinho".** O `PATCH` do drag persistia só o status. O refetch devolvia a lista por `createdAt` e o card voltava para onde a data mandasse, ignorando onde o vendedor o tinha soltado.
2. **Arrastar dentro da mesma coluna não fazia nada.** `handleDragEnd` retornava cedo quando o status de destino era igual ao de origem — não havia como reordenar dentro de uma coluna.
3. **Nenhuma referência visual de posição.** O vendedor não tinha como saber a ordem sem contar os cards.

As alternativas para corrigir:

- **Índice enviado pelo cliente** (`position: 3`): simples, mas o board é filtrável. Com filtro por vendedor ativo, "3º card visível" não corresponde a nada no ranking real do banco, e o card cairia num lugar plausível mas errado. Era exatamente o tipo de bug que ninguém perceberia — o card mudaria de lugar sem aviso.
- **Índice fracionário** (LexoRank, `posição = (anterior + seguinte) / 2`): um update por drag, sem reescrever o board inteiro. Em troca, aritmética de ponto flutuante que degrada com o tempo e um caso de "gap esgotado" que exige rebalanceamento periódico — um estado intermediário que ninguém no time sabe depurar.
- **Âncora + renumeração densa**: o cliente manda o id do card vizinho de destino; o servidor reinsere e renumera `1..N` numa transação.

Escolhi a terceira. O argumento decisivo é o filtro: com âncora, a inserção é relativo a um id que existe de verdade, então a ordem fica correta **também na visão filtrada** — que é onde o vendedor trabalha.

## Decisão

### `position` é um inteiro global, não por coluna

`deals.position integer NOT NULL`, ranking único `1..N` sobre todos os negócios do time. A ordem dentro de cada coluna é só a fatia desse ranking.

Alternativa descartada: numerar por coluna (`partition by status`). Seria mais fácil de depurar no `psql`, mas tornaria a troca de status um caso especial — mover um card entre colunas exigiria renumerar as duas, e o `PATCH` de status vindo do modal de edição teria que fazer isso também. Com ranking global, **trocar de status não renumbra nada**: o card passa a aparecer em outra coluna, no lugar que o ranking global já lhe dá. Só o drag, que é a única operação que muda a ordem de verdade, pays o custo da renumeração.

### Ordenar por `position DESC`

O maior `position` é o primeiro card. Dois efeitos saem de graça:

- Negócio novo recebe `MAX(position) + 1` no `create` — é o maior, logo primeiro card da coluna "Aberto", com insert O(1) e sem renumerar nada.
- O backfill `row_number() OVER (ORDER BY created_at DESC, id DESC)` preserva exatamente a ordem visual que já existia, sem linha fora do lugar no dia da migration.

`desc(id)` permanece como segunda chave para a ordenação continuar total e determinística.

### O drag manda âncora, não índice

`PUT /deal/:id/position` com `{ afterDealId, status }`. `afterDealId` é o card **depois** do qual o negócio entra; `null` manda para o topo. O cliente decide antes/depois comparando o centro do card arrastado com o centro do card sobrevoado; soltar na área vazia da coluna ancora no último card.

Um drag muda status e ordem atomicamente, num request só. Fazer isso com dois (`PATCH` de status + reorder) abriria uma janela em que o card está na coluna nova com a ordem antiga.

A âncora ausente — outro vendedor moveu o card entre a leitura e o drop — cai no topo, com log. O polling de 10s do [ADR-002](002-kanban-optimistic-update.md) reesincroniza de qualquer forma; errar é melhor do que um 409 que o vendedor não sabe resolver.

### `position` não entra no DTO

A ordem já está implícita na ordem do array de `GET /deal/search`, e o selo no card é o índice desse array. Expor o campo no `DealDTO` seria contrato redundante. Ele também não é atributo do negócio: é layout do board, então vive no repositório — que já trata de detalhe de storage como a conversão de `numeric` em `create`/`update`.

### `move` é a primeira transação do projeto

Um drag renumera várias linhas. Sem transação, o board ficaria com `position` duplicado no meio da requisição. Segue o [ADR-005](../padroes-de-codigo/005-acoplamento-infra.md): o acoplamento com drizzle fica no repositório.

Só as linhas cujo `position` muda de fato são escritas — num drag são tipicamente 3 a 5.

## Consequências

- **Aceito**: renumerar `1..N` a cada drag é O(n) em escritas. Na escala atual ([ADR-002](002-kanban-optimistic-update.md) assumiu "centenas de deals" sem paginar) é irrelevante. Se o board crescer para dezenas de milhares, esse passo vira o gargalo e o caminho natural passa a ser índice fracionário com rebalanceamento.
- **Aceito**: last-write-wins em drags concorrentes. A transação serializa as escritas, mas dois vendedores arrastando ao mesmo tempo resolvem pelo último a chegar. É o mesmo tradeoff que o ADR-002 já aceitou ao recusar optimistic locking com `version`. Se o conflito virar visível, o próximo passo é `version` no deal + `409`.
- **Aceito**: a âncora obsoleta cai no topo em vez de falhar. Preferi o card chegar perto do topo e se corrigir no próximo poll a um erro que trava o board para o vendedor.
- **Consequência de contrato**: a ordenação deixou de ser "por data de criação" e passou a ser "por posição". O teste em `test/deal/e2e/list.test.ts` que fixava a ordenação anterior foi renomeado — ele continua verde, mas por outro motivo, e dizer qual é o nome certo importa.
- **Otimistic update esticou**: `applyOptimisticPatch` só trocava campos; agora o `onMutate` do move também reordena o array, senão o card voltaria ao lugar durante a request. O polling pausa durante o move, pelo mesmo motivo que já pausava no `PATCH`.
- **Fora de escopo**: paginação no kanban, filtro salvo, sincronização de filtro com URL, optimistic locking. O [ADR-002](002-kanban-optimistic-update.md) continua vigente; este ADR muda a origem da ordem, não as decisões de update, polling ou visibilidade de time.
