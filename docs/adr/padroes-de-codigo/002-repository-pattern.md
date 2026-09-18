# ADR-002: Repository Pattern com inversão de dependência

**Status**: Aceito

## Contexto

Use-cases precisam ler e salvar dados sem saber como (Drizzle, SQL, etc.). Se eles chamassem o banco diretamente, testar sem banco real ficaria impossível e trocar de ORM viraria uma caça a referências.

A ideia por trás é inversão de dependência: o use-case depende de uma abstração, não da implementação.

## Decisão

A abstração de acesso a dados é um **Repository**: interface (`SellerRepository`) separada da implementação (`DrizzleSellerRepository`). O use-case recebe a interface injetada.

## Consequências

- Nos testes unitários, passo um fake do repositório — sem banco
- Trocar de ORM não mexe nos use-cases
- A interface define o que o domínio precisa de dados; como isso é feito é problema da persistência
- Só abstraio onde tem necessidade real (persistência) — não espalho interface para tudo
