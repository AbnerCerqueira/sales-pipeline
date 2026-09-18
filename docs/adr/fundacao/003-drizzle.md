# ADR-003: Drizzle ORM ao invés de Prisma/TypeORM

**Status**: Aceito

## Contexto

Preciso de uma camada para falar com o Postgres. Prisma e TypeORM são populares, mas escondem demais o SQL para o que este projeto precisa: um ORM leve, num projeto de escala pequena.

## Decisão

Drizzle ORM: perto do SQL nativo, com tipos TypeScript nas queries.

## Consequências

- Eu escrevo queries quase como SQL e sei exatamente o que roda no banco
- `drizzle-kit push` atualiza o schema do banco direto das tabelas — ótimo para prototipar sem escrever migrations na mão
- Custa conhecer SQL de verdade — o ORM não faz mágica por mim
