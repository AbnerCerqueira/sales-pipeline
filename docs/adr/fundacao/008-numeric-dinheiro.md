# ADR-008: Dinheiro em `numeric(12, 2)`

**Status**: Aceito

## Contexto

O Deal precisa armazenar um valor monetário em BRL (`value`). As opções clássicas no Postgres:

- **`real` / `double precision`** — ponto flutuante binário; não representam exatamente `0.1` e acumulam erro em somas/roundings (clássico `0.1 + 0.2 !== 0.3`). Inaceitável para dinheiro.
- **`integer` em centavos** — exato e rápido, mas empurra a convenção "×100 / ÷100" para todo código que lê/escreve (domínio, DTO, frontend, testes). Fácil de esquecer a conversão e guardar `1500` querendo dizer R$ 1.500,00 em vez de R$ 15,00.
- **`numeric(p, s)`** — decimal exato armazenado como texto pelo driver; precisão definida por schema.

## Decisão

Usar **`numeric(12, 2)`** na coluna `deals.value`:

```ts
// backend/src/modules/deal/persistence/drizzle/deal-table.ts
value: numeric("value", { precision: 12, scale: 2 })
```

- `precision: 12, scale: 2` → até 10 dígitos inteiros + 2 decimais (máx. `9.999.999.999,99`), validado no `createDealSchema` com `.max(9999999999.99)`
- O domínio e o DTO trabalham com `number | null` (`z.number().nullable()`)
- Na borda de persistência: escrita com `value.toFixed(2)` e leitura com `Number(row.value)`, porque o `node-pg` devolve `numeric` como `string`

## Consequências

- **Exatidão decimal sem conversão espalhada**: soma, exibição e validação usam reais com centavos (`1500.50`), sem regra de "centavos" fora da tabela
- **Conversão concentrada no repositório**: só `drizzle-deal-repository.ts` lida com `string ↔ number` — se um dia o valor virar tipo próprio (ex: `Money`), a troca é local
- **`string` no driver é o trade-off aceito**: diferente de `integer`/`float`, o Postgres devolve texto; é ruído pontual em `toDomain`, preferível a propagar `×100` pelo código
- **Escala do projeto**: 12 dígitos de precisão é folgada para um CRM de vendas pequeno; se um dia precisar de múltiplas moedas ou mais casas, vira um ADR novo (provável `numeric(14, 4)` ou tipo `money` de domínio)
