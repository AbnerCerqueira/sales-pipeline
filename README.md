# Sales Pipeline

CRM simples para um time de vendas gerenciar leads e negócios. Um painel onde o vendedor vê seus negócios organizados por status (kanban) e consegue criar leads, negociar, comentar e fechar vendas.

## Tech Stack

| Camada       | Tecnologias                                                          |
| ------------ | -------------------------------------------------------------------- |
| **Backend**  | Fastify 5, Drizzle ORM, PostgreSQL 16, Zod, JWT, bcrypt, Pino        |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query     |
| **Shared**   | Zod schemas (validação compartilhada entre back e front)             |
| **Infra**    | Docker, pnpm workspaces, Biome (lint/format), Vitest, Testcontainers |

## Decisões de design

A stack, os padrões de código, as features e o processo deste projeto evoluíram bastante desde o planejamento inicial. **As decisões finais — com contexto, alternativas consideradas e trade-offs aceitos — estão nos [ADRs](docs/adr/README.md)** (Architecture Decision Records). Este README mostra o resultado; o *porquê* de cada escolha vive lá, e mudanças de rumo viram um novo ADR.

É lá que está o porquê de escolhas como Postgres em vez de MongoDB, ou a estratégia de tratamento de erros, entre outros.

## Roadmap

### Essencial

- [x] Setup do projeto (monorepo, Docker, configs)
- [x] Login/Cadastro (Seller module)
- [x] Cadastrar lead
- [x] Listar e filtrar lead
- [x] Cadastrar negócio (Deal)
- [x] Status do negócio (transição no funil, ganho/perdido)
- [x] Board (kanban)
- [ ] Comentários em lead/negócio

### Bônus

- [ ] Refinar funcionalidades já existentes
- [ ] Implementar IA

## Arquitetura

O projeto é um **monorepo** com 3 pacotes gerenciados por pnpm workspaces:

```
sales-pipeline/
├── shared/                       # @sales/shared
│   └── src/schemas/              # Schemas Zod + tipos usados por back e front
│
├── backend/                      # @sales/api
│   └── src/
│       ├── app.ts                # Factory do Fastify (plugins, rotas, swagger)
│       ├── config/               # envs, db, seed
│       ├── lib/                  # jwt, bcrypt, etc
│       ├── modules/
│       │   └── <entidade>/        # Um módulo autocontido
│       │       ├── <entidade>.ts            # Entidade de domínio
│       │       ├── <entidade>-repository.ts # Interface de persistência
│       │       ├── <entidade>-policies.ts   # Regras de negócio
│       │       ├── instances.ts            # DI manual (composição)
│       │       ├── routes/                 # Definição das rotas Fastify
│       │       ├── use-cases/              # Orquestração do fluxo
│       │       ├── services/               # Interfaces de serviços externos
│       │       └── persistence/            # Implementação Drizzle
│       └── utils/
│
├── frontend/                     # @sales/web
│   └── src/
│       ├── app.tsx               # Router
│       ├── components/           # Componentes de UI reutilizáveis
│       ├── context/              # Context API
│       ├── hooks/                # Server state (TanStack Query)
│       ├── lib/                  # API client, token, estilos
│       └── pages/                # Uma pasta por tela/fluxo
│
├── docs/adr/                     # Decisões de design (ADRs)
├── docker-compose.yml            # PostgreSQL 16
├── biome.jsonc                   # Lint e format
└── pnpm-workspace.yaml           # Config do monorepo
```

## Como rodar

Pré-requisitos: Node >= 24, pnpm 12 e Docker ou PostgreSQL.

```bash
docker compose up -d                  # sobe o PostgreSQL 16
pnpm install
pnpm --filter @sales/api db:push      # cria o schema no banco
pnpm dev                              # backend (:3333) + frontend (:5173)
```

Opcional: popular um seller padrão com `pnpm --filter @sales/api db:seed`. As envs do backend têm defaults que funcionam (veja `backend/src/config/envs.ts`); variáveis não padrão podem ser passadas via `backend/.env`.
