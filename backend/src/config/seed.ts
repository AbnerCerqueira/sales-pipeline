import type {
  CreateCommentInput,
  CreateDealInput,
  CreateLeadInput,
} from "@sales/shared";
import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "../config/db.ts";
import { BcryptPasswordHasher } from "../lib/bcrypt-password-hasher.ts";
import { commentsTable } from "../modules/comment/persistence/drizzle/comment-table.ts";
import { dealsTable } from "../modules/deal/persistence/drizzle/deal-table.ts";
import { leadsTable } from "../modules/lead/persistence/drizzle/lead-table.ts";
import { sellersTable } from "../modules/seller/persistence/drizzle/seller-table.ts";
import { logger } from "../utils/logger.ts";

const SEED_PASSWORD = "123456";

const SELLERS = [
  { email: "john@example.com", name: "John Doe" },
  { email: "maria@example.com", name: "Maria Silva" },
  { email: "joao@example.com", name: "João Souza" },
];

// Mesmo contrato dos use-cases; o seed resolve `responsibleId` (round-robin),
// `leadId` (a partir do e-mail) e as datas de fechamento.
type SeedLead = Omit<CreateLeadInput, "responsibleId">;

const LEADS: SeedLead[] = [
  {
    companyName: "Tech Solutions LTDA",
    description: "Indicação do cliente Acme, queroga a versão Enterprise.",
    email: "contato@techsolutions.com.br",
    fullName: "Ana Paula Ribeiro",
    source: "referral",
    whatsapp: "(11) 98888-1234",
  },
  {
    companyName: "Acme Corp",
    description: null,
    email: "compras@acmecorp.com",
    fullName: "Carlos Eduardo Lima",
    source: "inbound",
    whatsapp: "(11) 97777-5555",
  },
  {
    companyName: "Distribuidora Alfa",
    description: "Chegou pelo site, pediu orçamento de 200 licences.",
    email: "vendas@alfa.com.br",
    fullName: "Beatriz Souza",
    source: "inbound",
    whatsapp: "(21) 96666-4321",
  },
  {
    companyName: "Clínica Vida Plena",
    description: "Precisa de integração com sistema de agendamento.",
    email: "adm@vidaplena.com.br",
    fullName: "Marcos Vinícius Alves",
    source: "outbound",
    whatsapp: "(31) 95555-8888",
  },
  {
    companyName: "Condomínio Residencial Aurora",
    description: null,
    email: "sindico@condominioaurora.com.br",
    fullName: "Patrícia Nogueira",
    source: "outbound",
    whatsapp: "(11) 94444-7777",
  },
  {
    companyName: "Café do Porto Brewing",
    description: "Loja física + e-commerce, cliente pequeno.",
    email: "contato@cafedoporto.com.br",
    fullName: "Rafael Monteiro",
    source: "inbound",
    whatsapp: "(51) 93333-1010",
  },
  {
    companyName: "Logística Rapidez",
    description: "Indicação da empresa de transporte parceira.",
    email: "comercial@rapidezlog.com.br",
    fullName: "Fernanda Gomes",
    source: "referral",
    whatsapp: "(41) 92222-3030",
  },
  {
    companyName: "Instituto Novo Horizonte",
    description: null,
    email: "contato@novohorizonte.org.br",
    fullName: "Lucas Teixeira",
    source: "inbound",
    whatsapp: "(61) 91111-2020",
  },
  {
    companyName: "Mercado Bom Preço",
    description: "Rede com 12 lojas, quer dashboard de vendas.",
    email: "gerencia@bompreco.com.br",
    fullName: "Juliana Castro",
    source: "outbound",
    whatsapp: "(85) 98888-1212",
  },
  {
    companyName: "Studio Fotografia Arial",
    description: null,
    email: "contato@studioarial.com.br",
    fullName: "Rodrigo Farias",
    source: "other",
    whatsapp: "(27) 97777-4646",
  },
  {
    companyName: "Metalúrgica Vale Verde",
    description: "Projeto grande, ciclo de venda demorado.",
    email: "procurement@valeverde.com.br",
    fullName: "Camila Freitas",
    source: "referral",
    whatsapp: "(62) 96666-5858",
  },
  {
    companyName: "Padaria Doce Mel",
    description: null,
    email: "contato@docemel.com.br",
    fullName: "Thiago Martins",
    source: "inbound",
    whatsapp: "(48) 95555-9090",
  },
  {
    companyName: "Academia FitLife Centro",
    description: "Indicação do personal trainer.",
    email: "contato@fitlife.com.br",
    fullName: "Aline Rocha",
    source: "referral",
    whatsapp: "(71) 94444-7373",
  },
  {
    companyName: "Transportes Ipê",
    description: null,
    email: "comercial@transportesipe.com.br",
    fullName: "Bruno Cardoso",
    source: "outbound",
    whatsapp: "(92) 93333-2626",
  },
];

type SeedDeal = Omit<
  CreateDealInput,
  "expectedCloseDate" | "leadId" | "responsibleId"
> & {
  /** Dias à frente de hoje; negativo = fechamento no passado, null = sem data. */
  expectedCloseDateInDays: number | null;
  leadEmail: string;
};

const DEALS: SeedDeal[] = [
  {
    description: "Proposta Enterprise enviada, aguardando financeiro.",
    expectedCloseDateInDays: 21,
    leadEmail: "contato@techsolutions.com.br",
    status: "negotiating",
    title: "Contrato Enterprise - Tech Solutions",
    value: 85_000,
  },
  {
    description: null,
    expectedCloseDateInDays: 45,
    leadEmail: "contato@techsolutions.com.br",
    status: "open",
    title: "Expansão - módulo de relatórios",
    value: 24_500,
  },
  {
    description: "Fechado em 2x. Deploy iniciado.",
    expectedCloseDateInDays: -10,
    leadEmail: "compras@acmecorp.com",
    status: "won",
    title: "Licenças anuais - Acme",
    value: 42_000,
  },
  {
    description: "Orçamento enviado, cliente pediu revisão de preço.",
    expectedCloseDateInDays: 14,
    leadEmail: "vendas@alfa.com.br",
    status: "negotiating",
    title: "200 licenças - Distribuidora Alfa",
    value: 58_000,
  },
  {
    description: null,
    expectedCloseDateInDays: null,
    leadEmail: "vendas@alfa.com.br",
    status: "open",
    title: "Suporte premium anual",
    value: 9800,
  },
  {
    description: "Perdeu para concorrente por preço.",
    expectedCloseDateInDays: -35,
    leadEmail: "adm@vidaplena.com.br",
    status: "lost",
    title: "Integração com agendamento",
    value: 31_200,
  },
  {
    description: "Primeira reunião agendada com a administradora.",
    expectedCloseDateInDays: 30,
    leadEmail: "sindico@condominioaurora.com.br",
    status: "open",
    title: "Portal do morador - Condomínio Aurora",
    value: 17_600,
  },
  {
    description: "Sem resposta após 3 follow-ups.",
    expectedCloseDateInDays: -60,
    leadEmail: "sindico@condominioaurora.com.br",
    status: "lost",
    title: "Portaria digital",
    value: 7400,
  },
  {
    description: "Fechado, onboarding marcado para o mês que vem.",
    expectedCloseDateInDays: -3,
    leadEmail: "contato@cafedoporto.com.br",
    status: "won",
    title: "PDV + e-commerce - Café do Porto",
    value: 12_900,
  },
  {
    description: "Cliente pediu parcelamento do contrato.",
    expectedCloseDateInDays: 10,
    leadEmail: "comercial@rapidezlog.com.br",
    status: "negotiating",
    title: "Rastreamento de frota - Rapidez",
    value: 46_000,
  },
  {
    description: null,
    expectedCloseDateInDays: 60,
    leadEmail: "contato@novohorizonte.org.br",
    status: "open",
    title: "Plano institucional - Instituto Novo Horizonte",
    value: 21_300,
  },
  {
    description: "Fechado após negociação de desconto.",
    expectedCloseDateInDays: -20,
    leadEmail: "gerencia@bompreco.com.br",
    status: "won",
    title: "Dashboard de vendas - Mercado Bom Preço",
    value: 38_400,
  },
  {
    description: "Prospecção fria, ainda sem proposta.",
    expectedCloseDateInDays: null,
    leadEmail: "gerencia@bompreco.com.br",
    status: "open",
    title: "Expansão para as 12 lojas",
    value: 55_000,
  },
  {
    description: "Escopo pequeno, cabia no plano self-service.",
    expectedCloseDateInDays: -50,
    leadEmail: "contato@studioarial.com.br",
    status: "lost",
    title: "Site + portfólio - Studio Arial",
    value: 4500,
  },
  {
    description: null,
    expectedCloseDateInDays: 40,
    leadEmail: "procurement@valeverde.com.br",
    status: "open",
    title: "ERP industrial - Metalúrgica Vale Verde",
    value: 120_000,
  },
  {
    description: "Proposta em análise no jurídico do cliente.",
    expectedCloseDateInDays: 25,
    leadEmail: "procurement@valeverde.com.br",
    status: "negotiating",
    title: "Automação de produção - Fase 2",
    value: 63_750,
  },
  {
    description: "Fechado via indicação da FitLife.",
    expectedCloseDateInDays: -8,
    leadEmail: "contato@fitlife.com.br",
    status: "won",
    title: "Gestão de alunos - FitLife",
    value: 8900,
  },
  {
    description: null,
    expectedCloseDateInDays: 15,
    leadEmail: "contato@fitlife.com.br",
    status: "open",
    title: "App do aluno",
    value: 27_000,
  },
  {
    description: "Cliente adiou o projeto para o próximo trimestre.",
    expectedCloseDateInDays: -15,
    leadEmail: "contato@docemel.com.br",
    status: "lost",
    title: "Pedidos online - Padaria Doce Mel",
    value: 6300,
  },
  {
    description: null,
    expectedCloseDateInDays: 50,
    leadEmail: "comercial@transportesipe.com.br",
    status: "open",
    title: "Rotas otimizadas - Transportes Ipê",
    value: 33_800,
  },
  {
    description: "Renegociando escopo para caber no orçamento do cliente.",
    expectedCloseDateInDays: 7,
    leadEmail: "contato@techsolutions.com.br",
    status: "negotiating",
    title: "Consultoria de implantação",
    value: 18_000,
  },
  {
    description: "Fechado, cliente satisfeito com a entrega.",
    expectedCloseDateInDays: -45,
    leadEmail: "vendas@alfa.com.br",
    status: "won",
    title: "Migração de dados - Alfa",
    value: 14_200,
  },
];

// Mesmo contrato do use-case; o seed resolve o negócio pelo título, o autor
// pelo e-mail e a data de criação para a thread ter chronologicalidade.
type SeedComment = Omit<CreateCommentInput, "dealId"> & {
  authorEmail: string;
  /** Minutos antes de agora. Threads são ordenadas por `createdAt` crescente. */
  minutesAgo: number;
  dealTitle: string;
};

const COMMENTS: SeedComment[] = [
  {
    authorEmail: "john@example.com",
    content:
      "Reunião com o CTO hoje. Ele pediu SLA de 99.9% por escrito antes de aprovar.",
    dealTitle: "Contrato Enterprise - Tech Solutions",
    minutesAgo: 2880,
  },
  {
    authorEmail: "maria@example.com",
    content:
      "Achei o modelo de SLA que usamos na FitLife, te mando por e-mail agora.",
    dealTitle: "Contrato Enterprise - Tech Solutions",
    minutesAgo: 2760,
  },
  {
    authorEmail: "john@example.com",
    content:
      "Resposta deles: topa 4 anos se o módulo de relatórios entrar no mesmo contrato. Já refiz a proposta.",
    dealTitle: "Contrato Enterprise - Tech Solutions",
    minutesAgo: 90,
  },
  {
    authorEmail: "joao@example.com",
    content:
      "Financeiro pediu 5% de desconto para fechar ainda este mês. Bato o martelo?",
    dealTitle: "200 licenças - Distribuidora Alfa",
    minutesAgo: 1500,
  },
  {
    authorEmail: "maria@example.com",
    content: "Com 5% a margem fica apertada, mas o volume compensa. Eu apoio.",
    dealTitle: "200 licenças - Distribuidora Alfa",
    minutesAgo: 1440,
  },
  {
    authorEmail: "joao@example.com",
    content:
      "Fechado com eles. Contrato assinado, onboarding começa semana que vem.",
    dealTitle: "Licenças anuais - Acme",
    minutesAgo: 4320,
  },
  {
    authorEmail: "maria@example.com",
    content:
      "Contrato assinado aqui também. Valei a pena insistirem no prazo curto.",
    dealTitle: "PDV + e-commerce - Café do Porto",
    minutesAgo: 2880,
  },
  {
    authorEmail: "john@example.com",
    content:
      "Cliente quer parcelar em 4x. Preciso confirmar se o limite do advogado cobre.",
    dealTitle: "Rastreamento de frota - Rapidez",
    minutesAgo: 120,
  },
  {
    authorEmail: "maria@example.com",
    content:
      "Proposta ainda no jurídico. A cobrança de ontem não teve retorno, vou insistir.",
    dealTitle: "Automação de produção - Fase 2",
    minutesAgo: 4320,
  },
  {
    authorEmail: "joao@example.com",
    content: "Alunos migrados atrelados ao início do semestre. Sem pressa.",
    dealTitle: "App do aluno",
    minutesAgo: 5760,
  },
  {
    authorEmail: "john@example.com",
    content:
      "Adiou por causa da falta de orçamento. Retomar contato em janeiro.",
    dealTitle: "Pedidos online - Padaria Doce Mel",
    minutesAgo: 10_080,
  },
  {
    authorEmail: "john@example.com",
    content:
      "Lead pediu para remarcar a demo. Sem data até agora, é o terceiro contato.",
    dealTitle: "ERP industrial - Metalúrgica Vale Verde",
    minutesAgo: 720,
  },
];

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

/**
 * O seed é de desenvolvimento: popula o banco do zero a cada execução, para o
 * resultado não depender do que já existir de execuções anteriores.
 *
 * `truncate` numa transação única com as quatro tabelas — a ordem e o
 * `cascade` resolvem as FKs sem precisar apagar de fora para dentro.
 */
async function truncateAll() {
  await db.execute(
    sql`truncate table ${commentsTable}, ${dealsTable}, ${leadsTable}, ${sellersTable} cascade`
  );
}

async function seed() {
  await truncateAll();

  const hasher = new BcryptPasswordHasher();
  const hashedPassword = await hasher.hash(SEED_PASSWORD);
  const now = new Date();

  const sellerIds = SELLERS.map(() => uuidv7());
  const sellerIdByEmail = new Map(
    SELLERS.map((seller, index) => [seller.email, sellerIds[index]])
  );

  await db.insert(sellersTable).values(
    SELLERS.map((seller, index) => ({
      createdAt: now,
      email: seller.email,
      id: sellerIds[index],
      name: seller.name,
      password: hashedPassword,
      updatedAt: now,
    }))
  );

  // Reparte os responsáveis de forma determinística, para o board não ficar
  // com todos os leads e negócios no mesmo vendedor.
  const leadByEmail = new Map<string, { id: string; responsibleId: string }>();

  await db.insert(leadsTable).values(
    LEADS.map((lead, index) => {
      const id = uuidv7();
      const responsibleId = sellerIds[index % sellerIds.length];
      leadByEmail.set(lead.email, { id, responsibleId });

      return {
        companyName: lead.companyName,
        createdAt: now,
        description: lead.description,
        email: lead.email,
        fullName: lead.fullName,
        id,
        responsibleId,
        source: lead.source,
        updatedAt: now,
        whatsapp: lead.whatsapp,
      };
    })
  );

  // Comentários são resolvidos depois dos deals, porque referenciam o negócio
  // pelo título. `position` acompanha o índice do array para o board abrir com
  // a mesma ordem da lista de deals.
  const dealIdByTitle = new Map<string, string>();

  await db.insert(dealsTable).values(
    DEALS.map((deal, index) => {
      const lead = leadByEmail.get(deal.leadEmail);

      if (!lead) {
        throw new Error(`Lead não encontrado no seed: ${deal.leadEmail}`);
      }

      const id = uuidv7();
      dealIdByTitle.set(deal.title, id);

      return {
        createdAt: now,
        description: deal.description,
        expectedCloseDate:
          deal.expectedCloseDateInDays === null
            ? null
            : daysFromNow(deal.expectedCloseDateInDays),
        id,
        leadId: lead.id,
        // Board ordena por `position DESC`: quanto maior, mais perto do topo.
        position: DEALS.length - index,
        responsibleId: lead.responsibleId,
        status: deal.status,
        title: deal.title,
        updatedAt: now,
        value: deal.value?.toFixed(2) ?? null,
      };
    })
  );

  await db.insert(commentsTable).values(
    COMMENTS.map((comment) => {
      const dealId = dealIdByTitle.get(comment.dealTitle);
      const sellerId = sellerIdByEmail.get(comment.authorEmail);

      if (!dealId) {
        throw new Error(`Negócio não encontrado no seed: ${comment.dealTitle}`);
      }

      if (!sellerId) {
        throw new Error(
          `Seller não encontrado no seed: ${comment.authorEmail}`
        );
      }

      return {
        content: comment.content,
        createdAt: minutesAgo(comment.minutesAgo),
        dealId,
        id: uuidv7(),
        sellerId,
      };
    })
  );

  logger.info(
    {
      comments: COMMENTS.length,
      deals: DEALS.length,
      leads: LEADS.length,
      sellers: SELLERS.length,
    },
    "Database truncated and seed created."
  );
  logger.info(
    { password: SEED_PASSWORD, sellers: SELLERS.map((s) => s.email) },
    "Seed credentials."
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
