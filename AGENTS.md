# Sales pipeline

Este projeto é um CRM simples para um time de vendas gerenciar leads e negócios. Pense num painel onde o vendedor vê seus negócios organizados por status e consegue criar leads, negociar, comentar e fechar vendas

# Ideia geral para codificação

A arquitetura e código do projeto estão lidando com escala pequena então seja conciso para que permita implementar features rapidamente e ao mesmo tempo ser manutenível ao longo prazo, não quero abstrações mirabolantes ou código ilegível que parece impressionante, foco em ter uma base sólida mas ao mesmo tempo não se limite a fazer o mínimo, me mostre sua capacidade de pensar e implementar soluções elegantes

As próximas linhas são boas práticas, não exatamente uma série de regras

# Sumário

- **Seller**: o vendedor que acessa a plataforma, esse é nosso usuário
- **Lead**: potencial cliente cadastrado por um Seller
- **Deal**: negócio vinculado a uma Lead, entidade central do kanban/pipeline
- **Comment**: comentário em thread associado a um Deal

# Tipagem

- Evite cast de tipagem com o `as`. Utilize somente quando não existir uma alternativa segura usando o sistema de tipos do TypeScript
- Evite burlar tipagem por preguiça, pense numa solução tipada com TypeScript ao invés de usar `any` pra tudo
- Evite tipos inline se eles forem complexos ou se estiver repetindo muitas vezes, reutilize os tipos que já existem
- Os schemas de rotas estão localizados no pacote `shared` do monorepo, assim o back e o front conseguem manter o padrão das rotas
- Prefira `unknown` a `any` quando o tipo realmente não pode ser conhecido, e faça narrowing explícito antes de usar

# Logs

- Gosto de logs em lugares que são relevantes, use a instancia configurada no projeto com o nível adequado

# Onde estão as coisas

- `shared`: DTOs e schemas de validação de rota, utilizados por back e front.
- `backend`: API, regras de negócio, persistência.
- `frontend`: renderização dos dados.

# Antes de entregar

- Rode os testes relevante e build para a feature implementada
- Caso a adição/alteração envolva fluxo HTTP, suba o servidor e teste o endpoint, abra o browser e teste a interface
- Chame o revisor para entender se o código está duplicando alguma solução, quebrando algum padrão ja existente, etc. A primeira versão não é a versão final, não me faça perder tempo revisando uma coisa que claramente está errada ou mal feita
