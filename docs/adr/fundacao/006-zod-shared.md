# ADR-006: Schemas Zod no pacote shared

**Status**: Aceito

## Contexto

O backend valida requests e o frontend valida formulários. Se cada um tiver seu próprio schema, eles divergem silenciosamente a cada mudança na API.

## Decisão

Os schemas Zod vivem no pacote `shared`, e back e front importam os mesmos.

## Consequências

- **Um contrato só**: o backend valida o request e o frontend valida o form com o mesmo schema
- Mudança de contrato fica visível em um lugar só, e o typecheck reclama em quem usa
- Sem divergência entre o que a API aceita e o que o formulário valida
