# ADR-001: Monorepo com pnpm workspaces

**Status**: Aceito

## Contexto

Backend e frontend precisam compartilhar o pacote `shared` (schemas de validação). As opções na mesa: npm/yarn workspaces, pnpm workspaces, ou ferramentas de monorepo mais pesadas (Nx, Turborepo).

## Decisão

pnpm workspaces. O `shared` é importado por back e front via `workspace:*`.

## Consequências

- pnpm é mais rápido e economiza disco em relação a npm/yarn
- Compartilhar o `shared` não exige build tool pesado — a configuração inteira é um arquivo só (`pnpm-workspace.yaml`)
- Se um dia o projeto crescer e precisar de cache de build ou pipelines, dá para colocar Turborepo por cima sem mudar a estrutura
