# ADR-001: Testes e2e com template database

**Status**: Aceito

## Contexto

Os testes e2e usam Postgres real via testcontainers. Eu queria rodar os testes **em paralelo** para ir mais rápido — o que descarta um banco único compartilhado entre workers (os testes brigariam pelos mesmos dados). Podia apagar e recriar o banco entre testes sequenciais, mas é lento. E rodar `drizzle-kit push` para cada arquivo de teste também não: são segundos que, multiplicados por N arquivos rodando em paralelo, dominam o tempo da suíte.

## Decisão

Duas camadas:

1. **No começo da rodada** (uma vez só): sobe 1 container Postgres, cria um banco `sales_pipeline_template` e roda `drizzle-kit push` **uma única vez** nele
2. **Por arquivo de teste**: cria um banco novo com `CREATE DATABASE ... TEMPLATE "sales_pipeline_template"` — o Postgres copia o schema pronto em milissegundos

Barato o suficiente para cada worker ter seu próprio banco de verdade, o que torna o paralelismo possível sem briga.

## Consequências

- Testes e2e rodam em paralelo, cada arquivo no seu próprio banco — isolamento real
- Zero re-push de schema por worker: o custo por arquivo é um `CREATE DATABASE` quase instantâneo
- Entre testes, limpo as tabelas com `db.delete()` no `beforeEach` — simples e explícito, sem mágica de transação
- Nos testes unitários uso fakes escritos na mão (`MockSellerRepository`) — sem lib de mock
