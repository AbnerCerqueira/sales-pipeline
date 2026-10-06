# Sales Pipeline

CRM simples para um time de vendas gerenciar leads e negócios. Um painel onde o vendedor vê seus negócios organizados por status (kanban) e consegue criar leads, negociar, comentar e fechar vendas.

▶️ **Ver a demonstração** — login, cadastro de lead e negócio, kanban com drag, comentário em thread.

https://github.com/user-attachments/assets/fd0d7433-c1c2-4ac4-a270-50be21db9bc1

## Tech Stack

| Camada       | Tecnologias                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| **Backend**  | Fastify 5, Drizzle ORM, PostgreSQL 16, Zod, JWT, bcrypt, Pino, Swagger           |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query/ Virtual       |
| **Kanban**   | dnd-kit (drag & drop), virtualização de lista, optimistic update                 |
| **Shared**   | Zod schemas (validação compartilhada entre back e front)                        |
| **Infra**    | Docker, pnpm workspaces, Biome (lint/format), Vitest, Testcontainers            |

## Decisões de design

O projeto reúne diversas ADRs, mas as principais decisões até o momento seriam essas 5:

- **Drizzle em vez de Prisma**
  Um ORM próximo do SQL nativo. Com o Prisma, os modelos mais complexos acabam em
  `$queryRaw`: eu escreveria SQL de qualquer forma, só que com uma camada a mais
  no meio.
  → [ADR 003](docs/adr/fundacao/003-drizzle.md)

- **Acoplamento deliberado com a infraestrutura**
  Sem arquitetura hexagonal ou clean architecture. O domínio é pequeno e o foco
  está nas features. A inversão de dependência fica só onde realmente compensa:
  nas interfaces de repositório ou integração de lib externas com DI manual, que permitem trocar a
  implementação e testar com mocks sem montar uma arquitetura inteira em volta.
  → [ADR 005](docs/adr/padroes-de-codigo/005-acoplamento-infra.md)

- **Erros de negócio como exceções tipadas**
  Cada erro é uma classe nomeada que carrega o próprio `statusCode`. O domínio
  lança, o use-case propaga sem `try/catch` e o error handler do Fastify decide a
  resposta HTTP. Effect e `Result` foram avaliados e descartados: o custo não se
  justifica neste escopo.
  → [ADR 004](docs/adr/padroes-de-codigo/004-tratamento-erros.md)

- **Contrato forte entre cliente e servidor com Zod**
  Os schemas vivem no pacote `shared`: back-end e front-end importam os mesmos,
  então a validação da API e a do formulário nunca divergem em silêncio.
  → [ADR 006](docs/adr/fundacao/006-zod-shared.md)

- **Kanban com *optimistic update* para melhorar a UX**
  O card muda de coluna instantaneamente e volta ao lugar de origem se o servidor
  recusar a mudança. A abordagem pessimista obrigaria o usuário a esperar, ou a
  clicar de novo, numa ação que deveria ser imediata.
  → [ADR 002](docs/adr/features/002-kanban-optimistic-update.md)

Entre eles, vale destacar as decisões de modelagem de dados
[UUID v7](docs/adr/fundacao/004-uuid-v7.md) e
[dinheiro em `numeric(12, 2)`](docs/adr/fundacao/008-numeric-dinheiro.md), além
da decisão de processo
[e2e com template database](docs/adr/processo/001-template-database.md).

## Testes

Duas camadas, ambas com `vitest`:

- **Unit**: rodam sem banco de dados. Usam mocks que implementam as
  interfaces, o que permite testar comportamentos e regras de negócio
  de forma isolada.
- **E2E**: usam um Postgres real via testcontainers e fazem as requisições com
  `app.inject()` do Fastify, sem abrir servidor. Cada arquivo de teste roda em
  seu próprio *template database*, o que permite a execução em paralelo.

## Roadmap

### Essencial

- [x] Setup do projeto (monorepo, Docker, configs)
- [x] Login/Cadastro (Seller module)
- [x] Cadastrar lead
- [x] Listar e filtrar lead
- [x] Cadastrar negócio (Deal)
- [x] Status do negócio (transição no funil, ganho/perdido)
- [x] Board (kanban)
- [x] Comentários em negócio (thread na sidebar do card)

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

### Com Docker (sem instalar Node)

```bash
docker compose --profile app up      # Postgres + API (:3333) + frontend (:5173)
```

Sobe os três serviços de uma vez. O código vem da sua máquina por bind mount,
então **hot reload funciona**: salvar um arquivo reinicia a API e recarrega a
página. A API cria o schema sozinha na subida (`db:push`); para popular com
dados de exemplo:

```bash
docker compose exec api pnpm --filter @sales/api db:seed
```

Abra http://localhost:5173 e entre com `john@example.com` / `123456`.

Os serviços de app ficam no perfil `app` de propósito: `docker compose up -d`
sem perfil continua subindo **só o Postgres**, que é o que o fluxo sem Docker
abaixo usa. Não rode os dois ao mesmo tempo — a porta 5173 é a mesma.

### Sem Docker (Node na máquina)

Pré-requisitos: Node >= 24 e pnpm 12 (o Postgres continua vindo do Docker).

```bash
docker compose up -d                  # sobe o PostgreSQL 16
pnpm install
pnpm --filter @sales/api db:push      # cria o schema no banco
pnpm dev                              # backend (:3333) + frontend (:5173)
```

Opcional: popular o banco com dados de exemplo com `pnpm --filter @sales/api db:seed` — o seed **apaga todas as tabelas antes de popular**, então rode com cuidado: ele recria sellers, leads, negócios e comentários do zero a cada execução.

## Variáveis de ambiente

Todas têm valor padrão, então nada é obrigatório para rodar localmente. Para mudar, crie `backend/.env` e/ou `frontend/.env` (ambos já ignorados pelo git).

### Backend (`backend/src/config/envs.ts`)

| Variável         | Padrão                                | Para que serve                                                          |
| ---------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`   | `postgres://postgres:postgres@localhost:5432/sales_pipeline` | Conexão com o Postgres. É a única que costuma precisar mudar. |
| `PORT`           | `3333`                                | Porta da API.                                                           |
| `JWT_SECRET`     | `super-secret-key-change-in-production` | Assina o token de sessão. **Troque em qualquer ambiente real.**       |
| `JWT_EXPIRATION` | `24h`                                 | Validade do token.                                                      |
| `LOG_LEVEL`      | `info`                                | `debug` \| `info` \| `warn` \| `error`                                  |
| `NODE_ENV`       | `dev`                                 | `dev` \| `test` \| `prod`. Em `test`, o custo do bcrypt cai para 0.     |

### Frontend

| Variável        | Padrão                 | Para que serve                             |
| --------------- | ---------------------- | ------------------------------------------ |
| `VITE_API_URL`  | `http://localhost:3333` | Base da API nas requests                    |

### Testes

Os e2e sobem o próprio Postgres via testcontainers e definem `TEST_DATABASE_URL` sozinhos. Só é preciso `backend/.env.test` (já suportado) para apontar para um container já rodando em vez de subir um novo.
