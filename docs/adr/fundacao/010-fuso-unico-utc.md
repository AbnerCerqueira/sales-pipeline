# ADR-010: UTC em todo o stack, com um único fuso de exibição

**Status**: Aceito
**Substitui**: a seção "Um fuso de exibição" do [ADR-009](009-fuso-horario.md).
Continuam vigentes do ADR-009: `timestamptz`, DTOs com string ISO terminada em
`Z` e `expectedCloseDate` ancorado em meia-noite UTC.

## Contexto

O ADR-009 definia o fuso em três lugares: `APP_TIMEZONE` no backend, `TZ`/`PGTZ`
no container do Postgres e `timeZone` fixo em todo `Intl` do front. A hipótese
era que nenhum deles sozinho resolvia o problema.

Medimos o efeito real de cada um e concluímos que **só o do front influencia o
que o usuário vê**:

- **Backend:** todo campo de data dos DTOs sai por `toISOString()`, sempre em UTC
  com `Z`. Subir a API com `APP_TIMEZONE=Asia/Tokyo` ou com o padrão produz
  respostas idênticas.
- **Banco:** `timestamptz` guarda o instante, e o `node-postgres` reconstrói o
  `Date` corretamente com qualquer `TimeZone` de sessão. Mudar o `PGTZ` altera
  apenas como o `psql` exibe a linha (`23:07-03`, `11:07+09`, `02:07Z`), não o
  dado.
- **Front:** é o único que decide a exibição, mas nunca foi configurável. O fuso
  é a constante `TIMEZONE = "America/Sao_Paulo"` em `frontend/src/lib/format.ts`.

Isso gera dois problemas:

1. O mesmo valor está escrito em três arquivos e nada valida que concordem.
2. O `PGTZ` no compose sugere que controla o fuso do app, mas não controla. Isso
   já gerou a pergunta "para que serve essa env?".

O domínio, por sua vez, já é independente de fuso. Um teste unitário fixa
`process.env.TZ = "Asia/Tokyo"` para provar que o cálculo de datas de calendário
não muda com o fuso do processo.

## Decisão

**Todo o stack roda em UTC. O fuso de exibição é uma constante do front.**

Critério: config que precisa ser mantida em sincronia entre arquivos é config
errada. Uma fonte única não diverge.

- **Backend:** remover `APP_TIMEZONE` de `backend/src/config/envs.ts`, junto com
  o `process.env.TZ` que ele alimentava. Nenhuma data do backend depende de hora
  local. O único uso de API de hora local é o `daysFromNow` do seed, que soma
  dias em hora local e, por isso, não varia com o fuso.
- **Postgres:** remover `TZ` e `PGTZ` do `docker-compose.yml`. O banco passa a
  rodar em UTC, que já é o padrão da imagem.
- **Front:** manter `TIMEZONE` em `frontend/src/lib/format.ts`, documentada como
  a única definição do fuso de exibição. É **constante, não env**, porque é uma
  decisão de produto ("ontem" significa o mesmo para todo o time de vendas) e
  não uma configuração de máquina.
- **`expectedCloseDate`:** continua ancorado em meia-noite UTC e renderizado com
  `timeZone: "UTC"`. Isso fecha o round-trip do `<input type="date">`. O fuso de
  exibição nunca deve ser usado aqui: em fusos negativos, o dia apareceria
  deslocado para o anterior.

## Consequências

- **Não há fuso para configurar no stack.** Trocar o fuso de exibição é editar
  uma linha em `format.ts`. Para achar os usos, basta buscar `TIMEZONE`.
- **O `psql` passa a mostrar UTC.** É a única perda real, e só afeta inspeção
  manual. Para ver em horário local, use
  `psql -c "set timezone 'America/Sao_Paulo'"` na sessão, sem config permanente.
  Em compensação, o que o `psql` mostra é o mesmo que a API devolve.
- **O processo deixa de ter fuso explícito**, algo que o ADR-009 valorizava. Em
  dev ele herda o fuso da máquina e no container roda em UTC. Isso só importaria
  para código de hora local, que não existe no domínio.
- **Se o fuso virar por usuário**, a constante passa a ser env (`VITE_TIMEZONE`)
  ou campo do seller. A ancoragem de `expectedCloseDate` em UTC continua valendo,
  pois é independente do fuso de exibição e evita o off-by-one.
