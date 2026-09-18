# ADR-003: Policy classes para regras de negócio

**Status**: Aceito

## Contexto

Regras de negócio (ex: "email precisa ser único") embutidas dentro dos use-cases ficam difíceis de reusar e de testar sozinhas, e atrapalham a leitura do fluxo.

## Decisão

Regras de negócio ficam em classes próprias (`SellerPolicies`), que os use-cases chamam.

## Consequências

- A mesma regra pode ser usada por mais de um use-case
- Testo as regras isoladamente, com teste unitário
- O use-case fica orquestrando o fluxo; a regra fica na policy
