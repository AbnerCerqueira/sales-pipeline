# ADR-006: Retry com backoff na integração de IA (backend)

**Status**: Aceito

## Contexto

O resumo de deal (`POST /deal/:id/summary`, introduzido em `f95ef88`) depende de uma chamada de rede para a API do Gemini — fora do nosso controle e com falhas transitórias reais, observadas nos próprios logs: `503` ("model is currently experiencing high demand") que passa na tentativa seguinte, ao lado de erros permanentes como `404` (modelo aposentado pelo Google).

Cada tentativa custa tokens reais de uma API key paga, então "tentar de novo" não é grátis: a política de retry define quantas chamadas cada ação do usuário pode gerar no pior caso. As alternativas eram:

- **Retry no frontend** (`useDealSummaryMutation` com `retry > 0`): o front só enxerga o `503` genérico — não sabe dizer transitório de permanente — e cada retry dele reexecuta o use-case inteiro (leituras no banco inclusas). No pior caso, 3 tentativas no front × 3 no back = 9 chamadas pagas por 1 clique, além de duplicar a política em duas camadas e exibir erro-na-tela piscando a cada tentativa.
- **Sem retry**: o `503` transitório observado em produção viraria erro visível para o usuário sem motivo — a chamada seguinte quase sempre passa.
- **Retry com delay fixo**: pressiona a API já sobrecarregada no mesmo ritmo; backoff exponencial é o comportamento padrão esperado contra `429`/`503`.

## Decisão

**O retry vive só no backend, com backoff exponencial e teto.** Implementação em `backend/src/lib/gemini-provider.ts` (`requestWithRetry`):

- até `MAX_ATTEMPTS = 3` tentativas por ação do usuário, com espera de `BASE_DELAY_MS * 2 ** (attempt - 1)` (1s, 2s);
- só retenta erro **transitório** (`TRANSIENT_STATUS = {408, 429, 500, 502, 503, 504}`; status desconhecido retenta por conservadorismo em `isTransientError`);
- erro permanente (`4xx` como o `404` de modelo aposentado) ou resposta vazia falham na hora com `AiUnavailableError` — retry não ressuscita modelo aposentado, isso é trabalho para failover, não para retry;
- **o frontend tem `retry: false` explícito** (`hooks/use-deal-summary.ts`, com comentário linkando esta decisão): 1 clique = no máximo 3 chamadas, sempre.

## Consequências

- **Custo limitado por construção**: o pior caso por ação do usuário é conhecido (3 chamadas) e está num lugar só — auditar gasto de quota é ler uma constante, não caçar retry espalhado.
- **Latência eventual**: no pior caso o usuário espera os backoffs (~3s extras) em vez de ver um erro falso; o loading do botão já cobre essa espera, e cada tentativa é logada (`"Gemini retrying"` com `attempt`/`model`, mais `durationMs` no sucesso).
- **Política evolui sem tocar a UI**: timeout, failover entre modelos e circuit breaker entram no provider/use-case; o front continua com 1 request e 1 estado de loading.
- **Falha continua sendo `503` com toast e retry manual**: esgotadas as tentativas, o usuário vê "IA indisponível" e tenta de novo pelo botão — que recomeça o ciclo do zero, sem estado preso.
