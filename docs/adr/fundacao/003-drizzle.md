# ADR-003: Drizzle ORM ao invés de Prisma/TypeORM

**Status**: Aceito

## Contexto

Preciso de uma camada para falar com o Postgres. As alternativas que comparei:

- **TypeORM**: abraça o padrão decorator/active record e tem anos de issues conhecidas com queries complexas e versões de Node. A abstração atrapalha mais do que ajuda num projeto onde o SQL é simples e conhecido.
- **Prisma**: o modelo mais popular, mas esconde o SQL. O schema é uma DSL própria separada do código (config + gerador de client), o client gerado adiciona uma etapa de build no fluxo, e queries avançadas acabam exigindo `$queryRaw` — ou seja, escrevo SQL de qualquer forma, só que com mais indireção no meio.
- **Drizzle**: ORM leve que fica **perto do SQL nativo**, com tipagem TypeScript nas queries.

Neste projeto (escala pequena, queries conhecidas), o custo que Prisma e TypeORM cobram para abstrair o banco não se paga — prefiro escrever o SQL quase direto e saber exatamente o que roda.

## Decisão

Drizzle ORM + `drizzle-kit`: tipagem TypeScript nas queries e schema declarado em tabelas próximas do SQL.

## Consequências

- **Escrevo queries quase como SQL** e sei exatamente o que roda no banco
- **`drizzle-kit push` atualiza o schema direto das tabelas** — ótimo para prototipar sem migrations na mão; quando o schema estabilizar, `drizzle-kit generate` produz migrations versionadas
- **Custa conhecer SQL de verdade** — o ORM não faz mágica por mim; queries exóticas que outras libs escondem, aqui eu escrevo
- **Abro mão das facilidades do Prisma**: sem client gerado, sem `updateMany`/`upsert` com API agradável, sem a DX de migration e seed. Em troca tenho controle, leveza e menos etapas de build
