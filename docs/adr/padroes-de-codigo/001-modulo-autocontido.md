# ADR-001: Módulos autocontidos por domínio

**Status**: Aceito

## Contexto

Organizar o backend por camadas globais (todas as rotas juntas, todos os use-cases juntos) espalha o código de um domínio por várias pastas. Para mexer no "lead", eu teria que abrir cinco lugares diferentes.

## Decisão

Cada domínio (seller, lead, deal, comment) é uma pasta com tudo dele dentro: rotas, use-cases, entidade, repositório e persistência.

## Consequências

- Adicionar um domínio novo é criar uma pasta nova — não mexo nos existentes
- Para entender ou mudar um domínio, fico dentro de uma pasta só
- Se um dia um domínio precisar virar um serviço separado, o código já está agrupado
