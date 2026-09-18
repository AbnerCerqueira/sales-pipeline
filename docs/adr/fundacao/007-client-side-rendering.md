# ADR-007: Client-side rendering (React + Vite + TanStack Query) ao invés de SSR

**Status**: Aceito

## Contexto

O frontend podia renderizar no servidor (Next.js, Remix) ou no cliente (SPA). SSR ajuda em SEO, primeira pintura mais rápida e compartilhamento de links públicos — coisas que importam em sites e e-commerce. Mas este projeto é um **CRM interno**: tudo fica atrás de login, não tem SEO pra fazer, e as telas são cheias de dados dinâmicos de qualquer jeito.

## Decisão

SPA com React 19 + Vite 8, e TanStack Query cuidando dos dados que vêm do backend:

- Vite para build e dev server (HMR rápido, zero configuração de SSR)
- React Query para cache e revalidação — um hook por domínio (`useLeadsQuery`, `useAuth`)
- Tipos de request/response vindos do `shared`, sem repetir contrato

## Consequências

- Deploy simples: o frontend é um bundle estático, qualquer CDN serve — não preciso de servidor Node só para renderizar páginas
- Cache, loading e revalidação ficam concentrados no React Query, em vez de espalhados entre server components, loaders e hidratação
- A primeira carga é mais lenta que SSR e não há SEO — aceito de olhos abertos, porque um app atrás de login não precisa disso
- Se um dia precisar de página pública (landing, SEO), resolvo fora do SPA
