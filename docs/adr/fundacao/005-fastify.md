# ADR-005: Fastify como framework HTTP

**Status**: Aceito

## Contexto

Precisava escolher o framework HTTP da API. As opções que considerei:

- **Express**: o mais popular e conhecido, mas mínimo demais — validação, schema e serialização ficam por minha conta (ou adiciono libs avulsas que divergem entre si). O Fastify entrega essas coisas como parte de primeira classe do framework.
- **NestJS**: traz DI, decorators e toda uma estrutura **opinionada** — em escala pequena isso vira peso morto e briga com a escolha de acoplamento deliberado (padroes-de-codigo/ADR-005) onde não há necessidade. A inversão de dependência já é resolvida por DI manual e interfaces (padroes-de-codigo/ADR-002).
- **Fastify**: rápido (~2-3x o Express em throughput), com JSON Schema nativo para validação e serialização, ecossistema de plugins, tipagem forte entre schema e handler (`@fastify/type-provider-zod`) — e tenho mais familiaridade com ele.

## Decisão

Fastify 5 com `@fastify/type-provider-zod`, para tipagem forte entre schema Zod (originados no `shared`, fundacao/ADR-006) e o handler.

## Consequências

- **Tipagem forte** entre schema Zod e handler, sem cast — o que o use-case recebe já é o tipo validado
- **Plugins cobrem o que preciso** (JWT, CORS, Swagger) sem eu montar nada à mão
- **Performance é garantia futura**: se a API crescer, não vou precisar trocar de framework para aguentar
- **O que aceitei trocar**: abro mão do ecossistema gigante e dos exemplos do Express em troca de um framework opinionado em velocidade e validação. O NestJS fica descartado porque sua estrutura rígida não se paga na escala atual — e adotá-lo agora significaria acoplamento onde não há necessidade
