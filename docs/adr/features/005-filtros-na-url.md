# ADR-005: Filtros de listagem sincronizados com a URL

**Status**: Aceito

## Contexto

Os filtros de `/leads` (nome, vendedor, página) e `/deals` (título, lead, vendedor) viviam em `useState` local, dentro da página. Isso tinha três efeitos práticos:

- **não são compartilháveis**: mandar o link de "só os negócios daquele lead" exigia descrever o filtro em texto, e quem abria o link recebia a lista completa;
- **não sobrevivem a refresh ou a uma troca de página**: recarregar a tela ou voltar para a aba zerava os filtros;
- **o botão voltar do browser não servia para nada**: ele voltava de página, nunca desfazia um filtro — o histórico não guardava a decisão que o usuário acabou de tomar.

As alternativas consideradas antes de chegar na URL:

- **Estado local + `localStorage`**: resiste ao refresh, mas continua sem compartilhar e sem histórico — o voltar do browser continuaria saindo da página em vez de desfazer o filtro.
- **Libs de state em URL (`nuqs` e congêneres)**: resolvem exatamente este problema, mas adicionam uma dependência nova (com seu próprio ciclo de versionamento) para ~100 linhas de sincronia que o `react-router` já dá pronto.
- **`replace` puro em toda escrita**: a URL refletiria o estado sem empilhar histórico — mas aí o voltar sairia da página imediatamente depois do primeiro filtro, que é o oposto do comportamento desejado.

## Decisão

**A URL é a fonte de verdade dos filtros.** Os params espelham a querystring da API:

- `/leads?name=&responsibleId=&page=` e `/deals?title=&leadId=&responsibleId=`
- valor vazio/ausente remove o param (URL fica limpa: sem filtros = `/leads`), `page=1` é omitido, e `pageSize` não vai na URL (é constante da UI)
- a leitura é **campo a campo** (`readText`/`readUuid`/`readPage` em `lib/url-filters.ts`): um uuid quebrado, uma página inválida ou um texto acima do teto do schema derrubam só aquele campo para o default, sem afetar os outros

A escrita passa por `useUrlFilters` (`hooks/use-url-filters.ts`), sobre `useSearchParams`/`useNavigate`/`useNavigationType` nativos do `react-router-dom`:

- **mudança discreta** (selecionar vendedor/lead, paginar, limpar filtros) = **PUSH** — o botão voltar desfaz o filtro, uma decisão por vez;
- **texto digitado** (já com debounce de 300 ms) = **PUSH na primeira commit da sessão de digitação e REPLACE nas seguintes** — coalescing: uma pausa no meio da digitação não empilha histórico, e o modo "search" reseta quando a navegação é um POP;
- **voltar/avançar troca os params sem desmontar a página** — o `useSearchInput` ressincroniza o input a partir da URL e descarta o debounce pendente, para que um timer velho nunca reescreva por cima do estado restaurado.

Duas regras transversais evitam histórico inútil:

- **URL igual não navega**: um patch que não muda a querystring não chama `navigate` (empilharia uma entrada idêntica, e o voltar não mudaria a tela). O `FilterLink` (`components/filter-link.tsx`) é a forma de link de filtro — ele aplica essa regra e marca a origem da entrada, porque a navegação por `<Link>` não passa pelo `pushFilter`; usar `<Link>` direto nesses casos é justamente o que deixa a marca de fora.
- **a origem só é marcada quando a navegação acontece**: um patch redundante (reselecionar o vendedor já ativo, no meio de uma digitação) não pode transformar o próximo commit de busca em PUSH e reabrir a entrada no meio do coalescing.

A navegação de lead é **por nome** (`/leads?name=`): a sidebar monta o link com o nome que já está no `DealDTO`, e a busca de leads não tem filtro por `id`. O `leadId` do kanban, por sua vez, precisa mostrar o **nome** no `LeadCombobox` — e o label sai do DTO que já está em tela (o `deal.lead` dos deals carregados, repassado como `leadHint`), sem query extra só para resolver o nome.

## Consequências

- **Links compartilháveis e restauráveis**: a URL vira o estado salvo da listagem — refresh, histórico e mandar no chat reproduzem a mesma tela; os links internos (negócios de um lead, a partir da tabela de leads e do card do kanban; lead da sidebar do deal) usam os mesmos params.
- **O voltar anda decisão por decisão**: desfazer um filtro é um passo, não um salto para fora da página. O custo é que digitar um termo longo vira uma entrada só no histórico (coalescing), então não dá para voltar letra por letra — escolha consciente.
- **Custo de manutenção próprio**: são ~210 linhas de sincronia (`useUrlFilters` + `useSearchInput` + `url-filters` + `FilterLink`) em vez de uma lib que faz isso. Em contrapartida, zero dependência nova e o comportamento de histórico é exatamente o que a tela pede, sem negociação de configuração.
- **A validação vive na leitura, não na escrita**: a URL é editável à mão, então todo valor lido passa pelo guard do campo — uuid quebrado e página inválida caem no default sem derrubar os outros params, e o texto é truncado no teto do schema da busca para não virar 400. Um param inválido **não** é normalizado de volta na URL: a tela mostra o estado real (o filtro não está aplicado) e o param segue editável à mão, em vez de a URL Mentir sobre o que a lista está mostrando.
- **Estado órfão é normalizado, não oferecido como saída**: uma página além do total (deep link velho, ou filtro que encolheu) é reescrita com `replace` — sem entrada no histórico, porque não foi uma decisão do usuário. A alternativa, oferecer "Limpar filtros", apaga também `name` e `responsibleId` e ainda some com o rodapé de paginação, que só existe quando há itens na tela.
