# ADR-005: Acoplamento deliberado com infraestrutura

**Status**: Aceito

## Contexto

Arquiteturas como hexagonal ou clean architecture isolam o domínio de frameworks e libs. Isso cria camadas, adapters e indireção — complexidade que não se paga num projeto pequeno cujo objetivo é entregar features rápido.

## Decisão

Aceitar o acoplamento onde ele existe. A entidade `Seller` importa da classe base `Entity` (que usa `uuidv7`), os use-cases às vezes dependem de implementações concretas, e as rotas são escritas direto com Fastify. **De propósito.**

As abstrações que existem (`Repository`, `PasswordHasher`) entraram **porque tinham necessidade real** — testes e desacoplar o que realmente muda (persistência, hashing).

## Consequências

- Desenvolvimento rápido, sem indireção desnecessária
- Os pontos de acoplamento são conhecidos e ficam dentro dos módulos — se o projeto crescer, desacoplar vai custar pouco
- Meu critério para abstrair é necessidade concreta (teste, troca de implementação), não dogma
