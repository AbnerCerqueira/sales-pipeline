# ADR-006: Token de sessão em `localStorage` com header `Authorization`

**Status**: Aceito

## Contexto

O backend autentica com JWT stateless (`@fastify/jwt`, plugin `authenticate`) e o frontend é uma SPA pura cliente (fundacao/ADR-007) — não existe servidor intermediário cuidando da sessão. Depois do login, o navegador precisa guardar o token de alguma forma para mandar junto em cada request. As opções clássicas são: guardar num cookie `httpOnly` (definido pelo servidor, invisível pro JS) ou guardar no `localStorage` e enviar manualmente no header.

## Decisão

Guardar o JWT no `localStorage` (`sales-pipeline.token`) e enviá-lo explicitamente via header `Authorization: Bearer` em toda request (`frontend/src/lib/token.ts` e `frontend/src/lib/api.ts`).

A escolha foi pela **simplicidade**:

- **É um sistema interno** para um time pequeno, atrás de login, sem público externo e sem páginas que renderizam HTML vindo de usuário — o cenário onde cookie `httpOnly` realmente brilha não é o nosso.
- **O backend já foi feito assim**: `request.jwtVerify()` lendo o Bearer, testes e2e injetando o header, Swagger autenticando com `bearerAuth`. Cookie exigiria trocar o contrato do servidor inteiro (plugin de cookie, CORS com credencial, proteção CSRF) pra mover o mesmo token de lugar.
- **Tudo fica explícito e fácil de debugar**: o token é um valor que o código lê, escreve e envia — dá pra inspecionar no `localStorage`, copiar pro `curl` e simular expiração trocando o valor.
- **Sessão sobrevive ao refresh** sem complicação: o `AuthProvider` lê o token de forma síncrona no boot e decide entre `/login` e as rotas protegidas.

## Consequências

- **O principal risco aceito é XSS**: script malicioso executado na origem consegue ler o token. Mitigo no que dá barato — React escapa o render por padrão, não usamos `dangerouslySetInnerHTML` — e o JWT expira em 24h, limitando o estrago.
- **Sem refresh token**: expirou, o client limpa o token, mostra "Sessão expirada" e volta pro `/login`. Renovar sessão silenciosamente não vale a complexidade pra escala atual.
- **Logout é só no client**: limpar o `localStorage` encerra a experiência, mas o JWT segue válido até expirar. Invalidação real só se um dia precisar.
- **Se o cenário mudar** (áreas com HTML de usuário, exigência maior de segurança), a migração é trocar o armazenamento por cookie `httpOnly` — o resto do fluxo (login, guards, rotas protegidas) continua igual. Até lá, permanece `localStorage`.
