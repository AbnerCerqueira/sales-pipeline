# Sales pipeline

Este projeto é um CRM simples para um time de vendas gerenciar leads e negócios: um painel onde o vendedor vê seus negócios organizados por status e consegue criar leads, negociar, comentar e fechar vendas.

# Ideia geral para codificação

A arquitetura e o código do projeto são pensados para escala pequena. Seja conciso: o bastante para implementar features rápido e, ao mesmo tempo, continuar manutenível a longo prazo. Não quero abstrações mirabolantes nem código ilegível que só parece impressionante — o foco é ter uma base sólida sem se limitar a fazer o mínimo.

As próximas linhas são boas práticas, não uma série estrita de regras.

# Sumário

- **Seller**: o vendedor que acessa a plataforma, nosso usuário
- **Lead**: potencial cliente cadastrado por um Seller
- **Deal**: negócio vinculado a uma Lead, entidade central do kanban/pipeline
- **Comment**: comentário em thread associado a um Deal

# Tipagem

- Evite cast com `as`. Use somente quando não existir alternativa segura no sistema de tipos do TypeScript
- Evite burlar a tipagem por preguiça: pense numa solução tipada em vez de usar `any` pra tudo
- Evite tipos inline complexos ou que se repetem muitas vezes; reutilize os tipos que já existem
- Os schemas de rotas ficam no pacote `shared` do monorepo, para back e front manterem o mesmo padrão nas rotas
- Prefira `unknown` a `any` quando o tipo realmente não puder ser conhecido, com narrowing explícito antes de usar

# Logs

- Gosto de logs onde são relevantes: use a instância configurada no projeto, com o nível adequado

# Onde estão as coisas

- `shared`: DTOs e schemas de validação de rota, usados por back e front
- `backend`: API, regras de negócio, persistência
- `frontend`: renderização dos dados

# Testes

- Framework é `vitest`, com dois projetos em `backend/vitest.config.ts`:
  - **unit** (`backend/test/**/unit/`): sem banco, use fakes manuais implementando as interfaces (ex: `MockSellerRepository`), sem mocks de libs
  - **e2e** (`backend/test/**/e2e/`): Postgres real via testcontainers, requisições com `app.inject()` do Fastify, sem servidor aberto
- Teste na camada que faz sentido, sem repetir cobertura: um use-case que só repassa pro repositório é coberto pelo e2e; escreva teste unitário só quando houver lógica própria (policies, regras, transformações)
- Helpers de e2e ficam em `backend/test/<modulo>/e2e/helpers.ts` e as URLs ficam centralizadas em `routes.ts`
- Evite testes que não agregam valor — como testar código que já é validado pelo schema, em vez das regras no código

# Antes de entregar

- Rode os testes relevantes e o build da feature implementada
- Caso a adição/alteração envolva fluxo HTTP, suba o servidor e teste o endpoint, abra o browser e teste a interface
- Chame o revisor para entender se o código está duplicando alguma solução ou quebrando algum padrão já existente. A primeira versão não é a versão final: não me faça perder tempo revisando uma coisa que claramente está errada ou mal feita
