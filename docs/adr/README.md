# ADRs — Architecture Decision Records

Registro das decisões de design do projeto, organizadas por tópico e contando a história: como o projeto é estruturado, quais tecnologias o sustentam, como o código é escrito e como o trabalho acontece.

Cada ADR documenta três coisas que um `README` ou um comentário de código não contam: **o contexto** (o problema e as alternativas consideradas), **a decisão** e **os trade-offs aceitos**. É aqui que vive o *porquê* das escolhas — o `README` mostra o resultado final, os ADRs explicam como e por que chegamos a ele.

## `fundacao/` — estrutura, dados e stack

| ADR | Decisão | Status |
|-----|---------|--------|
| [ADR-001](fundacao/001-pnpm-workspaces.md) | Monorepo com pnpm workspaces | Aceito |
| [ADR-002](fundacao/002-postgresql.md) | PostgreSQL ao invés de MongoDB | Aceito |
| [ADR-003](fundacao/003-drizzle.md) | Drizzle ORM ao invés de Prisma/TypeORM | Aceito |
| [ADR-004](fundacao/004-uuid-v7.md) | UUID v7 como identificador | Aceito |
| [ADR-005](fundacao/005-fastify.md) | Fastify como framework HTTP | Aceito |
| [ADR-006](fundacao/006-zod-shared.md) | Schemas Zod no pacote shared | Aceito |
| [ADR-007](fundacao/007-client-side-rendering.md) | Client-side rendering ao invés de SSR | Aceito |
| [ADR-008](fundacao/008-numeric-dinheiro.md) | Dinheiro em `numeric(12, 2)` | Aceito |

## `padroes-de-codigo/` — como o código é escrito

| ADR | Decisão | Status |
|-----|---------|--------|
| [ADR-001](padroes-de-codigo/001-modulo-autocontido.md) | Módulos autocontidos por domínio | Aceito |
| [ADR-002](padroes-de-codigo/002-repository-pattern.md) | Repository Pattern com inversão de dependência | Aceito |
| [ADR-003](padroes-de-codigo/003-policy-classes.md) | Policy classes para regras de negócio | Aceito |
| [ADR-004](padroes-de-codigo/004-tratamento-erros.md) | Erros de negócio como `ApplicationError` | Aceito |
| [ADR-005](padroes-de-codigo/005-acoplamento-infra.md) | Acoplamento deliberado com infraestrutura | Aceito |
| [ADR-006](padroes-de-codigo/006-token-em-localstorage.md) | Token de sessão em `localStorage` com header `Authorization` | Aceito |

## `features/` — decisões de funcionalidade

| ADR | Decisão | Status |
|-----|---------|--------|
| [ADR-001](features/001-paginacao-offset.md) | Paginação por offset com envelope `PaginatedResult` | Aceito |
| [ADR-002](features/002-kanban-optimistic-update.md) | Kanban de deals com optimistic update | Aceito |
| [ADR-003](features/003-ordem-manual-kanban.md) | Ordem manual no kanban com campo `position` | Aceito |

## `processo/` — como o trabalho acontece

| ADR | Decisão | Status |
|-----|---------|--------|
| [ADR-001](processo/001-template-database.md) | Testes e2e com template database | Aceito |
| [ADR-002](processo/002-automacao-ia.md) | Automação parcial com agentes de IA | Aceito |

## Formato

ADRs usam um template leve com três seções:

- **Contexto**: o problema e as alternativas consideradas
- **Decisão**: o que foi decidido
- **Consequências**: os trade-offs aceitos

## Quando criar um ADR

Abrir um novo ADR quando uma decisão **muda o que o código faz ou como ele é feito** a ponto de valer registrar o porquê, mesmo que ainda não exista código:

- escolha de tecnologia ou biblioteca (nova, ou troca de uma existente)
- padrão de código novo ou uma nova convenção
- comportamento de feature que envolve trade-off (UX, performance, consistência)
- mudança de processo que afeta como o time trabalha

Decisões triviais (formato de nome de variável, detalhe de estilo) não viram ADR — o custo de manter a documentação não se paga.

## Estado de uma decisão

- **Aceito**: decisão vigente
- **Superseded**: a decisão foi substituída por outra — o ADR antigo **não é editado** retroativamente; ele continua registrando o que foi decidido e por que na época, e o ADR novo que o substitui referencia o anterior. Esse histórico importa: é ele que mostra como e por que o projeto evoluiu.
