# ADR-003: Policy classes para regras de negócio

**Status**: Aceito

## Contexto

Regras de negócio (ex: "email precisa ser único") embutidas dentro dos use-cases ficam difíceis de reusar e de testar sozinhas, e atrapalham a leitura do fluxo.

## Decisão

Regras de negócio ficam em classes próprias, que os use-cases chamam. A escolha é deliberadamente **simples** — classes em um arquivo `*-policies.ts` ao lado do módulo, sem interface, sem DI formal:

- **Por que classe e não função solta?** Porque as regras de um domínio **evoluem juntas** e costumam **compartilhar dependências** (repositório para checar unicidade, etc.) — a classe agrupa e injeta isso uma vez, no `instances.ts`
- **Por que não `Service`?** "Service" viraria um guarda-chuva vago para qualquer coisa; `Policy` nomeia exatamente o que é: sim ou não, regra que valida uma intenção antes do efeito

## Consequências

- A mesma regra pode ser usada por mais de um use-case (ex: checar unicidade de email no register e no update)
- Testo as regras isoladamente, com teste unitário e sem banco (padroes-de-codigo/ADR-002)
- O use-case fica orquestrando o fluxo; a regra fica na policy
- **Trade-off aceito — uma classe por conjunto de regras**: para regras simples demais (um `if` sem dependência), a policy ainda existe, o que é um arquivo a mais; prefiro o padrão consistente ao desperdício ocasional de um arquivo pequeno
