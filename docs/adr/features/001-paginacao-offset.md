# ADR-001: Paginação por offset com envelope `PaginatedResult`

**Status**: Aceito

## Contexto

Listagens (como a busca de leads) crescem com o tempo, e o frontend precisa saber em que página está, quantos registros existem e se tem próxima página — sem ficar chamando o endpoint até virar lista vazia. A alternativa clássica seria paginação por cursor, que evita o `COUNT` mas não responde "quantas páginas existem".

## Decisão

Paginação por **offset** (`page`/`pageSize`) com um formato padrão genérico no `shared`:

```ts
// shared/src/schemas/pagination.ts
paginatedResultSchema(items) // => { items, page, pageSize, total }
```

- Query: `page` (padrão 1) e `pageSize` (padrão 10, máximo 100)
- Resposta: `items` + `page` + `pageSize` + `total`
- Ordenação fixa: `createdAt DESC, id DESC` — o UUID v7 desempata de forma estável, sem isso itens podem "pular" entre páginas
- O `COUNT` roda junto, no repositório

## Consequências

- **Frontend resolve o resto sozinho**: com `page`, `pageSize` e `total` na resposta, ele calcula total de páginas (`ceil(total/pageSize)`), `hasNext` (`page * pageSize < total`) e `hasPrevious` (`page > 1`) — a API não precisa de endpoint nenhum extra
- **Padrão para todo o projeto**: qualquer listagem nova usa `paginatedResultSchema(itemSchema)` e sai com o mesmo formato
- **Contrato único**: back e front validam com o mesmo schema do `shared` (fundacao/ADR-006)
- **O que aceito perder**: `COUNT` em cada request e a possibilidade de itens pularem de página se alguém inserir no meio da navegação. Cursor resolveria, mas aí perco o `total` e a navegação por página fica mais complicada — irrelevante na escala atual
