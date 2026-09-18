# ADR-001: Monorepo com pnpm workspaces

**Status**: Aceito

## Contexto

Backend e frontend precisam compartilhar o pacote `shared` (schemas de validação). Opções: npm/yarn workspaces, pnpm workspaces, ou ferramentas pesadas de monorepo (Nx, Turborepo).

## Decisão

Usar pnpm workspaces. O `shared` é compartilhado entre back e front via `workspace:*`.

## Consequências

- pnpm é mais rápido e economiza disco comparado a npm/yarn
- Compartilhar o `shared` não precisa de build tool pesado — a configuração é um arquivo só (`pnpm-workspace.yaml`)
- Se o projeto crescer muito e precisar de cache de build/pipelines, dá para adicionar Turborepo por cima depois sem mudar a estrutura
