# ADR-002: PostgreSQL ao invés de MongoDB

**Status**: Aceito

## Contexto

Tenho mais familiaridade com MongoDB, então parei para pensar em como o CRM ficaria nele de verdade:

- **Comment dentro do Deal e Deal dentro do Lead**: funciona bem. Raramente preciso de um comentário sem o negócio junto
- **Kanban**: a tela principal busca negócios **de todos os leads** por status, ordenados e filtrados por vendedor. Com negócios embutidos dentro de leads, essa busca vira um aggregation pipeline sobre arrays — o caso em que Mongo rende pior. Na prática, eu teria que tirar o Deal de dentro do Lead de qualquer forma
- **Vendedor é compartilhado**: lead e negócio apontam para um seller que aparece em muitos lugares. No Mongo eu teria que fazer `$lookup` (que é um join com outro nome) ou copiar o nome do seller e atualizar na mão toda vez que ele mudar

Ou seja: o embed resolve comentário, mas os relacionamentos principais continuariam lá, só que com trabalho manual.

## Decisão

PostgreSQL 16 com Drizzle ORM (ADR-003), chaves estrangeiras de verdade e UUID v7 (ADR-004).

## Consequências

- O banco garante que um negócio sempre aponta para um lead e um vendedor que existem — sem código extra meu
- A busca do kanban é um `WHERE` simples com índice
- Paginação com `total` (features/ADR-001) é natural em SQL
- Perco a simplicidade de embutir comentários — aceito essa troca pela busca global do board
- Aprendo Postgres num caso onde ele é a escolha certa, não a confortável
