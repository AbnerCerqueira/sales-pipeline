# ADR-005: Fastify como framework HTTP

**Status**: Aceito

## Contexto

Precisava escolher o framework HTTP da API. Fastify é um dos mais rápidos que existem (2-3x mais que Express, por exemplo), tem suporte nativo a JSON Schema para validação e serialização, um ecossistema de plugins bom — e tenho mais familiaridade com ele. Escolha sólida.

## Decisão

Fastify 5 com `@fastify/type-provider-zod` para ter tipagem forte entre schema Zod e handler.

## Consequências

- Tipagem forte entre o schema Zod e o handler, sem cast
- Os plugins cobrem o que preciso (JWT, Swagger)
- Se a API crescer, a performance já está lá sem precisar migrar de framework
