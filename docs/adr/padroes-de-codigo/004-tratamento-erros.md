# ADR-004: Erros de negócio como `ApplicationError`

**Status**: Aceito

## Contexto

Erros de negócio (email duplicado, credenciais inválidas) precisam virar resposta HTTP correta.

## Decisão

Cada erro de negócio é uma classe que estende `ApplicationError`, com `statusCode` e `message` definidos. As rotas não têm try/catch: o erro sobe até o error handler do Fastify, que mantém o `statusCode` da classe e devolve `{ statusCode, error, message }` — o formato que o frontend lê. Erros de infraestrutura (banco fora, token inválido) seguem o mesmo caminho.

## Consequências

- Use-cases lançam erros de negócio sem saber nada de HTTP
- Respostas de erro iguais em toda a API, sem eu precisar de handler customizado — a serialização padrão do Fastify já respeita o `statusCode`
- Sem try/catch espalhado pelas rotas
- Se um dia o frontend precisar de códigos de erro próprios, o próximo passo é um `setErrorHandler` global montando esse formato num lugar só
