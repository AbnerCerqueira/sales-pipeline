# ADR-004: Erros de negócio como exceções tipadas (`ApplicationError`)

**Status**: Aceito

## Contexto

Um erro de negócio (email duplicado, credenciais inválidas, entidade não existe) nasce no use-case/policy — longe de onde ele vai ser tratado. É preciso decidir *como esse erro se propaga* pela aplicação até chegar em quem sabe lidar com ele.

Isso é diferente de **validação de contrato** (campo faltando, formato errado), que já é resolvida pelo schema Zod na borda da rota (fundacao/ADR-006) antes mesmo do use-case rodar. Esta ADR trata só do segundo caso: erro de negócio, decidido dentro da regra de negócio.

Três formas gerais de modelar isso:

| | Onde fica o erro | Custo |
|---|---|---|
| **Effect** (`Effect<A, E, R>`) | No tipo de retorno. `Effect<Receipt, EmptyCart \| CardDeclined>` diz como a função falha; o compilador aponta o caso não tratado no ponto onde o erro é consumido, não em produção ([Understanding Why You'd Use Effect TS](https://cm.xyz/blog/understanding-why-youd-use-effect-ts)). `R` tipa dependências: `runPromise` exige `R = never`, então dependência não fornecida é erro de build. | O mais forte dos três, e o mais caro: efeitos como valores mudam o modelo mental inteiro — toda assinatura vira `Effect` com `gen`/`pipe`. Quem consome o erro no fim da cadeia ainda precisa mapear `E` para o que fizer sentido ali (um status HTTP, um retry, o que for). |
| **Result type** (`Result<T, E>`, neverthrow/Either) | Na assinatura, como valor — sem runtime novo. | Nenhuma camada intermediária decide algo com a falha aqui; cada uma só desembrulha e reembrulha para repassar. Cerimônia pura até o ponto final, que ainda precisa do mesmo mapeamento manual. |
| **Throw tipado** (escolhido) | Cada erro é uma classe nomeada estendendo `ApplicationError`. | Sobe pela pilha sem cerimônia e chega no único ponto que decide o que fazer com ele. Tipado está o **contrato do erro** (forma, `instanceof` para estreitar, metadados que a classe carregar); não está a **assinatura da função** — TypeScript não tem checked exceptions. |

## Decisão

Cada erro de negócio é uma classe nomeada estendendo `ApplicationError`. A regra que detecta a violação lança o erro (`throw`); nenhuma camada intermediária captura, desembrulha ou reembrulha — ele sobe até o único lugar que sabe o que fazer com aquele tipo de erro.

### Por que não Effect nem Result

O app é um CRM simples, escopo pequeno, poucos side-effects — não é onde Effect brilha. O critério do artigo citado: Effect paga quando há I/O significativo (APIs externas, filas, retries, mais de uma integração concorrendo), porque é aí que erro tipado e o canal `R` se justificam. Aqui:

- poucos casos de erro
- caminhos lineares (policy lança → use-case propaga → quem consome não captura no meio)
- uma única decisão tomada com a falha, num único lugar

O argumento de "dependência tipada" do `R` já existe por outro caminho: a DI manual com interfaces (padroes-de-codigo/ADR-002 e ADR-005), onde dependência faltando não compila no construtor.

Escolhi o mais simples porque o escopo é pequeno. Se crescer para muitas integrações e casos de erro ramificados, reabre a discussão.

## Aplicação neste projeto: API HTTP

O projeto atual é uma API, então "o único lugar que sabe o que fazer com o erro" é o error handler do Fastify — e o que ele faz é decidir o status HTTP.

- Cada classe de erro carrega `statusCode` e `message` fixados nela (ex.: `EmailAlreadyInUseError` carrega `409`).
- As rotas não têm try/catch.
- O handler mantém o `statusCode` da classe e devolve `{ statusCode, error, message }` — o formato que o frontend lê.
- Erros de infraestrutura seguem o mesmo caminho (mais detalhe nas Consequências).

Isso resolve de graça a tensão "use-case sem saber de HTTP": o use-case não decide status, só lança um erro com semântica de domínio. É a própria classe do erro — não o use-case, nem a rota — que sabe que vale `409`. Isso é consequência de onde o `statusCode` mora, não o motivo da escolha de throw tipado: se amanhã este código virasse um worker de fila em vez de uma API, o mesmo padrão de exceção tipada valeria, só mudaria quem consome o erro no topo (um handler de mensagem em vez do Fastify).

## Consequências

**Do padrão (exceção tipada), em geral:**

- Quem lança o erro não sabe nada de quem vai consumi-lo — só da semântica do erro
- Sem try/catch espalhado pelo meio do caminho
- **Trade-off aceito — o compilador não acompanha a propagação.** `execute(): Promise<SellerDTO>` não menciona `EmailTakenError`; quem capturar no meio do fluxo precisa estreitar com `instanceof` em runtime. Isso é seguro pelo conjunto fechado de classes de erro, por teste unitário com `toBeInstanceOf`, e por e2e assertando o comportamento. Se aparecer retry ou fallback no meio do caminho, é hora de reavaliar Result/Effect.
- **Trade-off aceito — uma classe para cada erro.** Um erro novo significa uma classe nova (ou reaproveitar uma existente com mensagem diferente). É cerimônia pequena frente à alternativa — `throw new ApplicationError("...")` solto, que espalha a mensagem por cada `throw` e deixa o teste assertando só "deu erro".

**Específicas de ser uma API HTTP:**

- Respostas de erro iguais em toda a API, sem handler customizado meu — a serialização padrão do Fastify já respeita o `statusCode`
- **Trade-off aceito — falha de infra não é tipada.** Banco fora do ar, ou violação de unique no `insert` (a unicidade é checada antes, com corrida entre os dois) sobem como `Error` cru e viram `500`. Mapear isso é papel da fronteira do repositório — se um dia precisar (ex: `23505` → `409`), é lá que o mapeamento nasce.
