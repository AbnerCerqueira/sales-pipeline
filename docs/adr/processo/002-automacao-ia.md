# ADR-002: Automação parcial com agentes de IA

**Status**: Aceito

## Contexto

Todo o trabalho deste projeto poderia ser feito por agentes de IA — código, testes, deploy e documentação. O que impede é o **orçamento**: automação completa não cabe no custo atual.

## Decisão

Dividir o trabalho entre o que eu automatizo e o que faço na mão:

- **Automatizado**: escrita de código (agentes de IA implementam), documentação
- **Manual**: explorar o código, testar a cada integração nova e revisar código

## Consequências

- Qualidade mantida sem estourar o orçamento
- O projeto evolui de forma sustentável enquanto a automação completa não cabe no custo
