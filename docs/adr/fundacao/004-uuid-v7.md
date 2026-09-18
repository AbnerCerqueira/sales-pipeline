# ADR-004: UUID v7 como identificador

**Status**: Aceito

## Contexto

Toda entidade precisa de um ID. Comparei as opções:

- **Auto-increment**: expõe quantos registros existem (basta somar IDs) e complica quando mais de uma coisa gera ID
- **UUID v4**: aleatório, não tem ordem — o índice do Postgres sofre porque inserções caem em lugares aleatórios da árvore
- **UUID v7**: aleatório o suficiente, mas ordenado pelo tempo

## Decisão

UUID v7, gerado em um só lugar: a classe base `Entity`.

## Consequências

- IDs crescem com o tempo, então inserções novas caem no fim do índice — melhor para o Postgres
- Não expõe a contagem de registros
- Buscar por "mais recentes" fica natural porque a ordem do ID acompanha a data de criação
