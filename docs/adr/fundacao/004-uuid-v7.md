# ADR-004: UUID v7 como identificador

**Status**: Aceito

## Contexto

Toda entidade precisa de um ID. Comparei as opções:

- **Auto-increment**: expõe quantos registros existem (basta somar os IDs) e complica quando mais de uma coisa gera ID
- **UUID v4**: aleatório, sem ordem — o índice do Postgres sofre porque as inserções caem em lugares aleatórios da árvore
- **UUID v7**: aleatório o suficiente, mas ordenado pelo tempo

## Decisão

UUID v7, gerado em um só lugar: a classe base `Entity`.

## Consequências

- IDs crescem com o tempo, então inserções novas caem no fim do índice — melhor para o Postgres
- Não expõe a contagem de registros
- Buscar por "mais recentes" fica natural porque a ordem do ID acompanha a data de criação
- **Trade-off aceito — 16 bytes por ID**: um UUID ocupa o dobro de um `bigint` e o quadruplo de um `serial int`. Em índices de tabelas com centenas de milhares de linhas isso importa; na escala de um CRM interno, é irrelevante frente à conveniência de não depender de sequência nem coordenar geração distribuída
- **A ordem por tempo é em milissegundos, não total**: dois IDs criados no mesmo ms se desempateiam por sorte, então a ordenação por ID é *quase* cronológica. Nas listagens eu desempato de forma estável com `ORDER BY createdAt DESC, id DESC` (features/ADR-001) — o papel do v7 é evitar que itens "pulem" entre páginas
