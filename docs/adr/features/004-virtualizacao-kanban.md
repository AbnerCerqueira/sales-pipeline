# ADR-004: Virtualização da lista de cards do kanban

**Status**: Aceito

## Contexto

Este ADR precisa de pouco contexto prévio, mas o número que decide tudo está em [ADR-002](002-kanban-optimistic-update.md): `GET /deal/search` devolve **todos** os negócios do time, sem paginação. A decisão foi consciente — paginar um kanban esconde cards, e o vendedor precisa do pipeline inteiro para decidir a ordem de uma coluna. O preço dessa escolha é que o board desenha a lista inteira, e o custo de desenhar cresce junto com o time de vendas.

O lugar onde esse custo aparece é o **arrasto**. Arrastar um card é a única interação do board em que o navegador redesenha muito: o cursor se move dezenas de vezes por segundo, e a cada movimento o React reavalia o que está na tela.

Duas grandezas aparecem na medição, e é útil separá-las desde o começo:

- **renderização**: o trabalho do React de desenhar os componentes. O profiler do React DevTools mede isso e relata em *commits* — cada commit é um lote de componentes redesenhados de uma vez.
- **elementos no DOM**: quantos cards existem na tela de fato naquele momento.

Com a lista inteira, os dois crescem juntos. Num arrasto de 3,8 segundos com os 322 negócios do time:

- **1.355 ms de renderização** — 36% do arrasto inteiro gasto em React
- **15 commits que redesenharam os 322 cards**
- **4.903 renders de `DealCard`**, que é o componente que usa o hook de arrastar do dnd-kit

A distribuição mostra onde está o gasto: o hook de arrastar sozinho responde por 500 ms, o contexto do dnd-kit por 318 ms, as colunas por 176 ms. E o **corpo visual do card — título, valor, datas, avatar — levou 74 ms em 112 renders**. Ou seja: o card em si é barato de desenhar. O caro é o hook de arrastar, que precisa rodar para cada card a cada vez que o dnd-kit muda de estado — 15 vezes para 322 cards.

Isso define o problema com precisão: **o custo é proporcional ao número de cards que existem na tela, não ao número de eventos de arrasto**. Nenhuma memoização resolve, porque o hook de arrastar do dnd-kit lê o contexto do React, e contexto atravessa `memo`. As saídas são duas: desenhar menos cards, ou trocar a biblioteca de arrasto.

### O que foi descartado antes de chegar aqui

- **Otimizar sem virtualizar.** A primeira tentativa foi mexer na medição interna do dnd-kit (`MeasuringStrategy.BeforeDragging`, que mediria os cards uma vez no início do arrasto em vez de durante). **Não resolve**: por padrão a biblioteca já mede uma vez no início, e desligar a medição durante o arrasto bloqueia também a remedida sob demanda — que é justamente o que uma coluna precisa fazer quando a lacuna de destino empurra os cards.
- **Aceitar o custo.** Descartado: antes das otimizações que já existiam, um arrasto de 1 segundo bloqueava a thread por 3,7 segundos.
- **Paginação ou scroll infinito.** Rejeitado por contrariar o ADR-002, e porque não resolveria: os cards continuariam acumulando conforme a rolagem.
- **`content-visibility: auto` (CSS).** Uma linha, sem risco para o arrasto. Descartado porque não remove o elemento da página: o card continua ali e continua ocupando a caixa que o CSS assumir, não a real. Trocaria lentidão de pintura por posição errada de card. Continua sendo a ferramenta certa se um dia o custo virar só de pintura.

Sobrava desenhar menos cards. A ferramenta é bem conhecida; o que a torna cara aqui é que **o dnd-kit nunca foi pensado para listas em que a maioria dos itens não existe** — e ele depende de todos eles.

## Decisão

Cada coluna é o próprio scroller (`max-h-[62vh] overflow-y-auto`) e desenha só os cards visíveis na rolagem, mais alguns de folga (`overscan: 6`), usando `@tanstack/react-virtual`. Num pipeline de 322 negócios isso é cerca de 50 cards no DOM em vez de 322.

O fluxo completo de um arrasto, evento a evento e com os arquivos de cada passo, está mapeado no [README do diretório do kanban](../../../frontend/src/pages/deals/kanban/README.md). Este ADR registra o porquê; o README, o como.

### A medição que isola o ganho

Comparar os dois profiles exige cuidado: são **os mesmos 322 negócios**, mas os arrastos duraram tempos diferentes (3,8s antes, 2,0s depois), então o total de milissegundos não é comparável. A grandeze que sobrevive a isso é **o maior número de cards redesenhados num único commit** — daqui para frente, *o pico*. Ele não depende de quanto tempo o arrasto durou, e é exatamente a grandeze que a virtualização controla.

| 322 negócios, arrasto real | Antes | Depois |
|---|---|---|
| Cards no DOM | 322 | 50 |
| **Pico: cards num único commit** | **322** | **50** |
| Commits que atingiram o pico | 10 de 95 | 13 de 66 |
| Duração média desses commits | 72 ms | 28 ms |
| Cards redesenhados por segundo de arrasto | 1.298 | 351 |

A tabela diz algo que o total de tempo escondia: **a quantidade de trabalho caro não diminuiu — aumentou um pouco** (10 commits para 13). O que mudou foi o tamanho de cada pedaço: 6,4× menos cards por commit, 2,6× menos tempo cada. Treze redesenhos de 50 cards são o mesmo esforço repetido que dez redesenhos de 322, só que sobre muito menos material.

Isso também elimina a principal ressalva metodológica. Durante a implementação foram trocadas duas coisas ao mesmo tempo — a virtualização e a troca do evento de arrasto do dnd-kit (explicada abaixo) — o que deixava ambíguo qual das duas produzia o ganho. O pico resolve a ambiguidade: **trocar o evento de arrasto não pode baixar o pico**, porque ele muda *quando* a posição do card é recalculada, não *quantos cards existem*. Se o pico caiu de 322 para 50, a causa é uma só, e ela é a virtualização.

Pelo lado do que o usuário sente, a mesma comparação com uma lista maior (912 negócios, medindo o bloqueio de thread pela API de long tasks do Chrome) foi de **2.256 ms bloqueados e 18 long tasks para 54 ms e 1 long task**, com os cards no DOM caindo de 912 para 35.

### O que a virtualização obrigou a mudar no arrasto

Virtualizar quebra uma premissa do dnd-kit: ele descobre "o que está sob o cursor" perguntando **quais elementos existem na tela**. Sem a lista inteira, essa resposta só cobre os cards desenhados — no resto da coluna o alvo vira a própria coluna, e o card cairia no fim dela. As mudanças que vieram daí se separam em dois grupos: refazer a detecção de posição, que o dnd-kit não consegue mais fazer, e acomodar o virtualizador, que passou a controlar o layout da coluna.

#### Reposicionar o drop: duas limitações do dnd-kit, duas trocas

**1. A detecção de colisão só enxerga os elementos montados.** O `over` do dnd-kit é exatamente a resposta de "o que existe na tela" — com cerca de 50 de 322 cards desenhados, ele só nomeia os cards montados e nunca as linhas fora da janela, que são a maioria. Por isso a posição do drop passou a ser calculada pela geometria: o board pergunta "em qual coluna está o ponteiro" e "qual linha a coordenada do ponteiro atravessa", usando a medição real da coluna (`board-drop-target.ts`). Antes, a posição vinha do card que o dnd-kit reportava estar sob o cursor.

**2. O `onDragOver` só dispara quando o alvo muda — daí a troca para `onDragMove`.** A conta de geometria exige o índice recalculado a cada movimento do mouse, e quem dispara a cada `mousemove` é o `onDragMove` (o mecanismo do `onDragOver` está no [README, §5](../../../frontend/src/pages/deals/kanban/README.md)). A troca 1 tornou a troca 2 inevitável: manter o `onDragOver` exigiria reescrever a resolução de colisão do dnd-kit — mais invasivo, não menos.

#### Acomodar o virtualizador

**3. A lacuna de destino não é um item da lista, é um deslocamento.** A primeira versão inseria a lacuna entre dois cards como se fosse mais um item da lista. Isso quebra a virtualização: inserir uma linha desloca a posição de todo card abaixo, e o cache de altura do virtualizador é indexado por posição — o tamanho medido passa a descrever outro card, e os cards fora da tela nunca são remedidos. O sintoma era a coluna com altura errada e cards se sobrepondo. Hoje a lista é sempre a mesma lista de cards, e a lacuna é um deslocamento aplicado às linhas a partir do ponto de inserção (`shiftAfter`).

**4. O cache de altura é chaveado pelo id do card, não pela posição** (`getItemKey`). É o mesmo problema pelo caminho oposto, e ele não aparece num carregamento limpo: aparece "conforme se vai mexendo os cards". Remover um card do meio da coluna desloca todos os outros, cada posição passa a descrever outro card, e só os que estão visíveis são remedidos. Chaveando pelo id, a medição acompanha o card, e a coluna mantém a mesma altura durante e depois de qualquer arrasto.

**5. A altura estimada é a média real dos cards** (161px, medida em ~580 cards: mínimo 143, máximo 183). A estimativa só é usada até o card ser medido de verdade. Estimar abaixo da média faz a coluna crescer conforme o usuário rola, e a barra de rolagem "escorrega" sob o ponteiro. É um palpite medido, não um padrão.

### Cada coluna tem rolagem própria, em qualquer tamanho de tela

Antes, a coluna só tinha rolagem interna em telas grandes; no celular, quem rolava era a página inteira. O virtualizador precisa saber qual elemento está rolando, e a medição de cada card é relativa a ele — a página inteira não serve. A coluna passou a ter rolagem própria em todos os tamanhos. **É uma mudança de interface, não um detalhe de implementação.**

Pelo mesmo motivo, o card que está sendo arrastado é forçado a continuar desenhado mesmo que a coluna role até ele sair da tela visível (`rangeExtractor`): é o hook dele que sustenta o arrasto, e o elemento reserva o espaço onde a animação de soltura vai pousar.

## Consequências

- **Aceito reescrever o cálculo da posição do drop.** Era a parte que mais custava, e foi resistida à época. Em troca, a posição deixou de ser "o card que a biblioteca diz estar sob o cursor" e passou a ser uma conta de geometria, pura e sem React — o que a tornou testável sem browser, ganho colateral que só se pagou depois com a divisão do board em módulos (commit `227f183`).
- **Aceito a altura da coluna variar enquanto se rola.** Com cards de altura variável, os cards ainda não visitados usam a estimativa, então a altura total muda conforme a rolagem — tipicamente 1% a 6% — e converge: a segunda rolagem já devolve o mesmo número. Ancoragem de scroll perfeita exigiria alturas fixas, que cards com título de tamanho variável não têm. A alternativa seria medir tudo antes de desenhar, que é exatamente o custo que a virtualização existe para evitar.
- **Aceito a mudança de interface no celular**: colunas com rolagem própria no lugar da página inteira rolando. É o comportamento comum em kanban, mas continua sendo uma troca.
- **Aceito que o dnd-kit enxergue só os cards desenhados.** A detecção de colisão dele continua no lugar e é a base do deslocamento visual que abre espaço quando o arrasto é dentro da mesma coluna, mas ela deixou de ser a fonte da verdade da posição. Duas fontes de verdade para "onde o card cai" seria pior que uma fonte só, aproximada e explicada.
- **Custo de implementação alto, desproporcional à complexidade do código final.** Foi preciso instrumentar o trace do Chrome e a API de long tasks para achar as causas. Os dois bugs de layout que apareceram — altura errada da coluna e cards sobrepostos — só apareceram depois de arrastar várias vezes em sequência e com a coluna rolada. **Lição de processo: testar o arrasto uma vez, no topo do board, não encontra nada disso.**
- **O frontend não tem runner de teste.** As funções puras do modelo (`board-model.ts`, `board-drop-target.ts`) não importam React e já seriam testáveis sem browser, mas não há infraestrutura de teste no pacote — a mesma lacuna que o ADR de automação reconhece, com o guardrail mais estreito em código de interface.
- **Caminho de saída, se a biblioteca atrapalhar mais.** A virtualização expôs um limite estrutural do dnd-kit: a detecção de colisão depende de elementos montados, e o `onDragOver` não acompanha o mouse dentro do mesmo alvo. Se a complexidade de acoplar o board à geometria passar a pesar mais que o ganho, a saída é trocar a camada de arrasto — não desligar a virtualização, que é o que sustenta o custo de render.
