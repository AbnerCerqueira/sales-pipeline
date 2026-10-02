# ADR-009: Instantes em `timestamptz` e um fuso de exibição por projeto

**Status**: Aceito — a seção "Um fuso de exibição" foi substituída pelo
[ADR-010](010-fuso-unico-utc.md), que mediu o efeito de cada peça e manteve só a
que decide a exibição. O resto deste ADR continua vigente.

## Contexto

O projeto convivia com dois problemas de data que se confundiam:

**1. O banco guardava parede, não instante.** As colunas `created_at`/`updated_at` eram `timestamp without time zone`. Com `node-postgres`, um `Date` JS é escrito como string **no fuso local do processo** e relido como **fuso local** — a conversão era simétrica dentro do mesmo processo, mas o valor armazenado era a renderização de um instante no fuso que o servidor happenstance rodava. O container do Postgres sobe em UTC e a máquina de desenvolvimento não; bastava trocar `TZ` do backend para que todo dado existente andasse horas, sem nenhuma mudança de código.

**2. O tipo do DTO não correspondia ao que viaja.** Os DTOs usavam `z.coerce.date()`, então o `z.infer` dizia `Date` — mas a API responde JSON, e o front recebia `string`. O tipo mentia em silêncio, e a prova era que os formatadores do front aceitavam `string | Date` e faziam `new Date(value)` para consertar. `z.coerce.date()` num schema de *resposta* também é semanticamente errado: é parse onde deveria ser formato.

Some-se a isso que `expectedCloseDate` nunca tinha sido `Date` em lugar nenhum — era `string` do request ao DTO, e o front precisava de um parser manual (`value.split("-").map(Number)`) só para contornar `new Date("2026-01-30")` ser interpretado como UTC.

E nada no projeto fixava um fuso: não havia `TZ` no `docker-compose.yml`, `APP_TIMEZONE` no backend, nem `timeZone` em nenhum `Intl.DateTimeFormat`. "Hoje" e "ontem" eram calculados no fuso do navegador, então dois vendedores em cidades diferentes viam rótulos diferentes para o mesmo lead.

## Decisão

Tratar **data de calendário** e **instante** como tipos diferentes, e normalizar o fuso do projeto.

### Instantes em `timestamptz`

```ts
createdAt: timestamp("created_at", { withTimezone: true }).notNull()
```

Com `timestamptz` o Postgres armazena o instante e devolve com offset; o `node-pg` reconstrói o `Date` corretamente em qualquer `TZ` do processo. O dado deixa de depender do ambiente onde foi gravado.

A migração (`SET TIME ZONE 'UTC'` antes do `ALTER`) assume que as linhas anteriores foram gravadas em UTC — verdade, porque o container do Postgres roda em UTC.

### DTO entrega string, entidade trabalha com `Date`

O DTO é a borda HTTP: datas viajam como string, nunca como `Date`. `z.coerce.date()` foi trocado por `z.iso.datetime()` nos DTOs de deal, lead e seller — o schema agora valida formato em vez de reparsear.

A entidade `Deal` passa a ter `expectedCloseDate: Date | null`, com `DealInput` (string) como forma de entrada. A conversão acontece em um único ponto (`hydrate`), coberto por `create`, `mutate` e `fromPersistence`.

### Um único formato de data no DTO

Todo campo de data do DTO — `createdAt`, `updatedAt` e `expectedCloseDate` — é **instante ISO com hora e `Z`**. A alternativa (tudo como data de calendário `YYYY-MM-DD`) foi descartada por destruir o tempo, e com ele o rótulo relativo ("Criado agora", "há 5 min") na lista de leads.

Isso tem duas consequências que valem registro:

- **`expected_close_date` virou `timestamptz`.** A coluna deixou de ser data de calendário e passou a ser um instante ancorado na meia-noite UTC. Perde-se a semântica de "data sem hora" no schema, em troca de um formato único na API.
- **O `<input type="date">` precisa de um corte.** O navegador produz `YYYY-MM-DD` e o DTO quer `2026-12-31T00:00:00.000Z`, então o modal de edição faz `.slice(0, 10)` para popular o campo e o update otimista converte no sentido inverso.

O lado da **request** continua aceitando `z.iso.date()` (`YYYY-MM-DD`) em `expectedCloseDate`, porque é literalmente o que `<input type="date">` produz — forçar instante ISO num payload de date picker só acrescentaria conversão sem ganho.

A ancoragem em meia-noite UTC segue valendo: `new Date("2026-01-30")` já é UTC por especificação, então o round-trip é exato e independente do `TZ` do processo. No front, `new Date(valor)` com um `Intl.DateTimeFormat` pinado em `timeZone: "UTC"` se cancelam, o que elimina o parser manual e o off-by-one em fusos negativos.

### Um fuso de exibição

- `APP_TIMEZONE` (default `America/Sao_Paulo`) em `config/envs.ts`, aplicado em `process.env.TZ` no boot
- `TZ` e `PGTZ` no container do Postgres
- `timeZone` pinado em todo `Intl` do front: `"UTC"` para a data de calendário, o fuso do projeto para instantes

A comparação de "hoje"/"ontem" passou a ser feita sobre o dia-calendário já no fuso do projeto, e não sobre a meia-noite local do navegador.

## Consequências

- **O dado deixa de depender do ambiente**: o mesmo registro gravado em UTC e lido em `Asia/Tokyo` devolve o mesmo instante
- **O tipo do DTO volta a ser verdade**: `lead.createdAt` é `string` no front, e `new Date(value)` é uma conversão legítima e não um remendo — as uniões `string | Date` saíram
- **Datas de calendário não têm fuso**: ancorar em UTC é a única escolha que faz o round-trip ser exato
- **Um fuso fixo é uma decisão de produto**: instantes renderizam sempre em `America/Sao_Paulo`, mesmo para um vendedor em outra região. Para o time de vendas atual isso é o desejado ("ontem" significa a mesma coisa para todo mundo); se um dia houver usuários em fusos distintos, o `TIMEZONE` de `frontend/src/lib/format.ts` passa a ser derivado do usuário em vez de constante
- **A migração assume UTC nas linhas antigas**: é uma decisão irreversível e ela vale para dados que já existiam. Para um ambiente novo, `timestamptz` desde o começo
- **`APP_TIMEZONE` não muda o que viaja na API**: o DTO sempre serializa em UTC. O valor existe para tornar o processo determinístico, não para deslocar instantes
