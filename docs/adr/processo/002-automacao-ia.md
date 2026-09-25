# ADR-002: Automação parcial com agentes de IA

**Status**: Aceito

## Contexto

Os agentes de hoje dão conta do ciclo inteiro do desenvolvimento — requisitos, planejamento, código, testes, revisão, deploy — em um workflow que roda e se valida em loop até a qualidade aparecer. Automação ponta a ponta já é possível; o que a impede não é técnica.

É **orçamento**. Montar esse workflow (papéis definidos para cada agente, tooling de observação e feedback, validação a cada passo) custa mais do que meu bolso aguenta.

O segundo freio é a **revisão**. O volume de código gerado hoje já passa do que um humano consegue revisar de verdade, e revisar tudo com o mesmo peso não é só inviável como desperdiça atenção: o mesmo olhar aplicado a código trivial e a uma decisão de arquitetura não é revisão, é leitura.

## Decisão

Automação parcial. O agente gera código e documentação; a revisão humana se distribui pelo **custo do erro** da mudança, não pelo tipo de tarefa.

**Geração automatizada** — implementação de código e documentação. O agente escreve, eu reviso o que importa.

**Revisão humana concentrada onde errar é caro:**

- decisões arquiteturais — novo padrão, mudança de stack, nova abstração
- regras de negócio
- testes que agregam valor — cobrem regra de negócio, não só happy path
- fundação do projeto — setup, configs, contratos entre módulos e no `shared`
- mudanças que só aparecem olhando além do arquivo alterado — reuso, consistência de padrão, quebra de contrato

**Revisão leve** — formatação, código que segue padrão já estabelecido, ajustes óbvios. O guardrail automático já barra regressão barata: testes (unit/e2e) e typecheck rodam em toda mudança antes de entregar. É o que libera a atenção para o que exige julgamento.

## Consequências

- **Qualidade dentro do orçamento**: o agente gera em escala e o olhar humano fica reservado para onde o custo do erro é alto
- **Trade-off aceito — código trivial pode escapar**: ele recebe atenção de menos, protegido pelo guardrail automático; se escapar, o custo é baixo e a correção vem na revisão seguinte. A alternativa — revisar tudo com o mesmo peso — é mais cara no total
- **Se um dia o orçamento permitir o agentic SDLC completo**, este ADR vira superseded por um novo, não é corrigido
- **A qualidade depende do processo ser cumprido**: os guardrails só protegem se rodarem de verdade e a revisão cara for feita de verdade — pular essa revisão é onde o custo escondido aparece
