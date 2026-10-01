# O kanban de negócios

Este diretório é o board de arrastar cards entre as colunas do pipeline
(`open → negotiating → won/lost`). Ele nasceu dentro de `deals-kanban.tsx`, que
cresceu até passar de mil linhas e misturar cinco assuntos. Os assuntos foram
separados em arquivos; este README é o mapa.

**Leia este arquivo antes de mexer em qualquer coisa aqui.** Boa parte do código
deste diretório parece errada à primeira leitura e não é — são decisões
medidas. Estão marcadas como tal ao longo do texto.

---

## 1. Mapa dos arquivos

| Arquivo | Assunto | React? | Linhas |
|---|---|---|---|
| `board-model.ts` | O modelo do board: colunas, tipos e as operações puras sobre a disposição | não | 129 |
| `board-drop-target.ts` | Geometria do drop: onde o ponteiro está → em qual índice | não | 130 |
| `board-status.ts` | Os 5 estados possíveis do board (carregando, erro, vazio, filtrado, pronto) | não | 28 |
| `use-deal-drag.ts` | O orquestrador do arrasto — estado, refs e os 3 handlers | hooks | 321 |
| `deals-board.tsx` | `DndContext`, o grid de colunas e as telas de erro/vazio | sim | 233 |
| `kanban-column.tsx` | Uma coluna: a lista virtualizada, o droppable e a lacuna | sim | 278 |
| `deal-card.tsx` | O card: o `useSortable` e o corpo visual (título, valor, datas) | sim | 160 |

Fora do diretório, `deals-kanban.tsx` (267 linhas) fica com o que é da tela:
filtros, header, queries e modal.

Os três primeiros não importam React e podem ser lidos (e testados) sem abrir o
browser. `CARD_SHELL`, a casca visual do card, mora em `deal-card.tsx` — é
aparência de componente, não modelo.

E a página, que fica em `src/pages/deals/deals-kanban.tsx`: filtros, header,
queries, modal. Ela não sabe nada de arrasto — só monta as peças.

**Ordem de leitura na primeira vez:** `board-model.ts` → `board-status.ts` →
`deal-card.tsx` → `kanban-column.tsx` → `use-deal-drag.ts` → `deals-board.tsx`.
Do mais estável (puro) ao mais reativo (hooks).

---

## 2. O modelo: o board é um mapa de ids

O dado central não é a lista de cards. É o **mapa coluna → ids na ordem de
exibição**:

```ts
type BoardColumns = Record<DealStatus, string[]>;
```

Ids, não `DealDTO`. Três motivos:

1. É o que o backend entende: o drag manda `afterDealId` (o id do vizinho
   anterior), não um índice ([ADR-003](../../../../../docs/adr/features/003-ordem-manual-kanban.md)).
2. O `id` de um card não muda quando ele muda de status. Guardar o DTO inteiro
   dentro do mapa exigiria atualizar o card em dois lugares (na coluna de origem
   e na de destino) a cada arrasto.
3. `buildColumns(deals)` é barato e o dado DTO vem sempre da query.

As operações puras sobre esse mapa:

- `buildColumns` — lista plana → mapa (roda no render, memoisado)
- `findColumnOf` — em qual coluna está este id?
- `placeInColumn` — tira o id de onde está e reinsere em outra coluna/posição.
  Devolve `null` quando nada muda, que é o mecanismo que evita recalcular a
  cada pixel.
- `originAnchorOf` — a posição de origem, para reconhecer um drag sem efeito

Nenhuma delas toca no DOM nem sabe que React existe. Dá para ler e testar
funcionando.

---

## 3. Virtualização: por que a coluna não renderiza tudo

Cada coluna tem o seu próprio scroller (`max-h-[62vh] overflow-y-auto`) e não
renderiza todos os cards — só os que estão visíveis na janela de rolagem, mais
alguns de folga (`overscan: 6`). O porquê desta escolha e o preço dela estão no
[ADR-004](../../../../../docs/adr/features/004-virtualizacao-kanban.md); aqui
fica o como.

O padrão do `useVirtualizer` (`kanban-column.tsx`) é este e é contra-intuitivo
na primeira vez:

```tsx
<div style={{ height: virtualizer.getTotalSize() + shiftPixels }}>   {/* altura total estimada */}
  {virtualizer.getVirtualItems().map((row) => (
    <div style={{
      position: "absolute",           {/* fora do fluxo normal */}
      transform: `translateY(${row.start}px)`,   {/* posicionado à mão */}
      ref: virtualizer.measureElement,           {/* corrige a estimativa */}
    }} />
  ))}
</div>
```

Ou seja: o container tem a altura de **tudo** que existe, e cada linha é
posicionada por `transform`. O `measureElement` corrige a altura real de cada
linha depois que ela monta, porque `estimateSize` é só um palpite.

**Consequência que dói:** o cache de altura do virtualizador é indexado **por
posição**. Mover ou remover um card desloca todo o resto e cada índice passa a
descrever outro card — os cards fora da janela não são remedidos, e a coluna
fica com buracos e cards sobrepostos. Por isso existe o `getItemKey`, que
chaveia a medição pelo **id** do card em vez do índice:

```ts
const getItemKey = useCallback((index) => deals[index]?.id ?? index, [deals]);
```

E por isso a altura estimada é `161px`, que é a **média real** medida em ~580
cards (min 143, max 183). Estimar abaixo da média faz a coluna crescer conforme
o usuário rola, e a barra de rolagem "escorrega" sob o ponteiro.

---

## 4. dnd-kit: quatro APIs que parecem uma

| API | Quem chama | O que faz |
|---|---|---|
| `useDroppable({ id: status })` | `KanbanColumn` | torna a **coluna** um alvo de drop |
| `useSortable({ id: deal.id })` | `DealCard` | torna o **card** arrastável e ordenável |
| `SortableContext items={ids}` | `KanbanColumn` | declara a ordem dos itens ordenáveis de um alvo |
| `DragOverlay` | `DealsBoard` | a cópia flutuante que segue o cursor |

O card original **não sai do DOM** durante o arrasto: ele fica lá com
`opacity-0` (`isDragging`). Isso é deliberado — o `useSortable` dele é o que
sustenta o arrasto, e o nó reserva o espaço onde o `dropAnimation` do overlay
pousa. Por isso o card arrastado é forçado a continuar montado mesmo que a
coluna role até ele sair da janela, via `rangeExtractor`.

O `DragOverlay` renderiza `DealCardView`, **não** `DealCard` — `DealCardView`
não tem nenhum hook do dnd-kit, e um `useSortable` dentro do overlay causaria
colisão de id.

### `collisionDetection`

`preferCardCollision` (`board-drop-target.ts`) é uma função que decide qual
droppable está sob o ponteiro. O padrão do dnd-kit (`closestCenter`) compara
distâncias até o **centro** de cada alvo, e numa coluna alta o centro fica longe
do ponteiro: o mesmo drop podia resolver para a coluna (card vai para o fim) ou
para o card (card fica naquele slot), dependendo de meio pixel. Aqui o card
sempre vence a coluna, e a coluna só entra quando não há card embaixo do ponteiro.

---

## 5. O fluxo de um arrasto, na ordem em que o código roda

1. **`onDragStart`** — tira um snapshot da disposição atual para dois refs:
   `dragColumnsRef` (onde o card está *agora*) e `originColumnsRef` (de onde ele
   saiu). Registra um listener de `mousemove`. Nada é reordenado.

2. **`onDragMove`** — dispara a cada `mousemove`. Três passos, sem tocar no DOM:
   - `columnAtPoint(registry, x, y)` — em qual coluna está o ponteiro?
   - `dropIndexForColumn(...)` — o índice dentro dela
   - `placeInColumn(...)` — como ficaria o mapa se o card caísse ali agora

   O resultado vai para `dragColumnsRef` (ref, não state — escreve não agenda
   render) e, se mudou de coluna, `setTargetSlot` para desenhar a lacuna.

3. **`onDragEnd`** — lê `dragColumnsRef` (a resposta está pronta, não precisa
   recalcular), monta `{ afterDealId, status }`, guarda a disposição em
   `settledColumns` e chama `moveDeal.mutate`.

### O `onDragMove` é a peça que não tem o nome óbvio

O dnd-kit tem `onDragOver`, que parece o certo. Mas o `onDragOver` **só dispara
quando o alvo muda** — o efeito interno dele depende de `[overId]`. Mover o
ponteiro dentro do mesmo card não mudaria nada, e o índice ficaria congelado.
Como aqui a posição vem da **geometria** da lista e não do `over`,
`onDragMove` (que dispara a cada `mousemove`) é o evento certo.

### Por que a lista renderizada não muda durante o arrasto

Este é o ponto mais contraintuitivo do arquivo inteiro. A lista parece que
deveria reordenar em tempo real — não reordena.

Quando a lista mudava a cada mousemove, o `SortableContext` percebia via
`itemsHaveChanged` que a lista tinha mudado e mandava o dnd-kit remedir o board
inteiro: ~700 `getBoundingClientRect` forçando layout síncrono a cada
reposicionamento. Medido no board real: **2.980 medições e 3.700 ms de thread
bloqueada num arrasto de 1 segundo**.

Com a lista parada, isso vai a zero. O reflow visual passa a ser só o
`transform` que o dnd-kit já aplicava por baixo, e a única coisa que muda é a
lacuna (que é um `translateY` extra, não uma linha nova).

**`onDragEnd` é o único ponto do fluxo que escreve a lista renderizada**, e
acontece uma vez por arrasto, não por pixel.

### Por que `settledColumns` existe

No `onDragEnd`, o card já está na coluna certa. Se a página zerasse isso na
hora, o `isPending` do React Query só chegaria no tick seguinte — e o board
voltaria à coluna de origem por 1 commit. O card piscava de volta. É o bug que
o [ADR-002](../../../../../docs/adr/features/002-kanban-optimistic-update.md)
chamou de "fantasma".

Pelo mesmo motivo, os patches otimistas do `PATCH` são derivados **no render**
(`patchedDeals` / `optimisticDeals` na página) e não no `onMutate`: o `onMutate`
do React Query é `async` e roda num microtask depois do `mutate()`.

---

## 6. `useState` vs `useRef` no arrasto

A regra prática deste diretório:

- **O que precisa virar tela** → `useState`. `activeId`, `overColumn`,
  `targetSlot`, `overlayWidth`, `settledColumns`.
- **O que precisa estar disponível no próximo evento, sem re-render** →
  `useRef`. `dragColumnsRef`, `originColumnsRef`, `pointerRef`,
  `targetSlotRef`, `slotHeightRef`, `virtualizersRef`.

`onDragMove` é um `useCallback` **sem dependências** e roda a cada mousemove.
Se ele dependesse de state, o handler seria recriado a cada render, e o
cálculo precisaria do valor do render *anterior* — o índice sairia um mousemove
atrásado. Por isso os dados chegam por ref.

Um truque fino: o listener de `mousemove` é registrado com `capture: true`.
Fase `capture` roda **antes** do handler do dnd-kit; se o dnd-kit lesse
`pointerRef` antes de `trackPointer` atualizar, a geometria estaria sempre um
evento atrasada.

### `slotHeightRef` e o espelho de `targetSlot`

A lacuna é desenhada como um card invisível, e a altura dela **é medida** (a
linha "Prev." depende do negócio, cards têm alturas diferentes). Como o
`onDragMove` precisa da altura para converter coordenada em índice, a coluna
publica a medição num ref.

O `onDragMove` usa o slot **da iteração anterior** (`targetSlotRef.current`),
não o que ele está calculando agora. Isso é o que fecha o laço: o ponteiro é
medido contra o que está efetivamente desenhado na tela, que é sempre o
resultado do último mousemove processado.

---

## 7. A lacuna não é uma linha da lista

Esse é o detalhe que custou mais para acertar e que o próprio código denuncia
(`kanban-column.tsx`).

A primeira versão inseria a lacuna como uma linha da lista virtualizada, entre
dois cards. Isso **quebra a virtualização**: inserir uma linha desloca o índice
de todos os cards abaixo, e como o cache de altura é indexado por posição, o
tamanho medido passa a descrever outro card. Resultado: coluna com altura errada
e cards sobrepostos.

Hoje a lista é **sempre a mesma** — o card no índice `i` é sempre o mesmo card,
porque `getItemKey` chaveia por id. A lacuna é só um deslocamento:

```ts
// quanto a linha `index` desce por causa da lacuna
function shiftAfter(shift, index) {
  return shift.insertAt === null || index < shift.insertAt ? 0 : shift.pixels;
}
```

Aplicado em dois lugares: no `translateY` de cada linha (`kanban-column.tsx`) e
no cálculo do índice de drop (`dropIndexForColumn`). O mesmo número nos dois
 lados é o que mantém o card caindo onde a lacuna está desenhada.

---

## 8. Identidade como performance

`useMemo` aqui não é "evitar recalcular". É **"evitar passar referência nova"**.

O `items` do `SortableContext` é copiado pelo dnd-kit para configurar um
`ResizeObserver`. Array novo a cada render ⇒ o observer é re-registrado ⇒ ele
mede, seta estado, re-renderiza ⇒ o array é novo de novo. O ciclo se fecha e o
React reclama de `maximum update depth`. Por isso `byId`, `dealsByColumn` e
`itemsByColumn` são todos memoizados em `deals-board.tsx`, e `columns` é
memoizado em `use-deal-drag.ts`.

`NO_DEALS` e `NO_ITEMS` existem por causa disso: são referências estáveis para
o caso de coluna vazia.

O mesmo vale para `memo`. `DealCardView` é memoizada porque **contexto do React
atravessa `memo`**: o `useSortable` do `DealCard` lê contexto, então o card
re-renderiza ~90 vezes por mousemove e o `memo` do `DealCard` não segura
nada. Como o corpo do card depende só de `deal` e `position` — e os dois são
estáveis enquanto o card não muda de lugar — o memo no `DealCardView` corta a
subárvore inteira (15 elementos, 3 ícones, 4 formatações) fora do caminho
crítico do arrasto.

---

## 9. Armadilhas conhecidas

- **`useLayoutEffect` e não `useEffect`** no registro do virtualizador: o
  `onDragMove` lê esse registro no evento seguinte, e um efeito passivo
  chegaria tarde com a lista anterior.
- **Nada de sensor de toque.** No mobile a rolagem vertical da coluna viraria
  arrasto. Só `MouseSensor`, com ativação após 6px — o que também faz clique não
  virar arrasto.
- **`animateLayoutChanges: () => false`** no `useSortable` desliga a animação
  automática de reordenação. Com a lista congelada, ela só brigaria com o
  `transform` que o overlay já aplica.
- **Duplicação aparente**: `applyOptimisticMove` (em `hooks/use-deals.ts`) e
  `placeInColumn` (aqui) reordenam coisas parecidas e **não** devem ser
  unificados. A primeira espelha a reordenação do backend sobre o array de
  deals, para o cache do React Query; a segunda converte coordenada de ponteiro
  em índice de coluna. Dependem de entradas diferentes.
- **O polling pausa durante o arrasto.** Um `refetch` no meio do drag
  sobrescreveria o patch otimista. Por isso a página mantém `isDragging` como
  espelho: o `useDealDrag` consome a lista que a query devolve, então a query
  precisa saber do arrasto antes de devolver essa lista.

---

## 10. Três decisões de wiring que não são óbvias

**A disposição (`columns`) vem dentro do objeto `drag`.** `DealsBoard` recebe
`drag: DealDrag` e tira `columns` de lá, em vez de receber as duas coisas como
props separadas. Quem decide o layout renderizado é o arrasto — está no
`settledColumns ?? buildColumns(deals)` dentro do hook. Passar `columns` também
como prop criaria dois caminhos para o mesmo valor, capazes de divergir sem o
TypeScript reclamar.

**O card arrastado vem da lista otimista.** `useDealDrag` recebe `deals` (já
com os patches otimistas aplicados) e tira dele o `activeDeal` que alimenta o
overlay e a altura da lacuna. Antes da divisão, o overlay usava a lista crua da
query enquanto os cards usavam a otimista — no caso raro de um `PATCH` e um
arrasto ao mesmo tempo, o overlay e o card mostravam dados diferentes. Agora
mostram o mesmo. O guard `activeDeal.status !== columnStatus` em
`deals-board.tsx` também passou a ler o status real renderizado.

**A página espelha o arrasto num estado próprio.** `useDealsQuery` precisa saber
se há arrasto em andamento para pausar o polling, mas a query precisa existir
antes de `useDealDrag` — que consome a lista dela. O ciclo não fecha, então a
página guarda `isDragging` e o hook avisa por `onDraggingChange`. É a única
coerção entre os dois, e ela está nomeada no parâmetro.

---

## 11. Onde mexer quando

| Mudança | Arquivo |
|---|---|
| Novo status no pipeline, nova cor, nova coluna | `board-model.ts` (`DEAL_COLUMNS`) |
| Mudei a ordem que o servidor espera | `board-model.ts` (`placeInColumn`) |
| "O drop cai no lugar errado" | `board-drop-target.ts` (`dropIndexForColumn`) |
| "O card pisca / volta sozinho ao soltar" | `use-deal-drag.ts` (`settledColumns`) |
| "O arrasto trava a tela" | `use-deal-drag.ts` (`handleDragMove`) — ver §5 |
| "A coluna fica com buraco ou cards sobrepostos" | `kanban-column.tsx` (`getItemKey`, `estimateSize`) |
| "A lacuna aparece na coluna errada" | `deals-board.tsx` (a guarda do `placeholder`) |
| Filtros, busca, header, modal | `deals-kanban.tsx` (a página) |
