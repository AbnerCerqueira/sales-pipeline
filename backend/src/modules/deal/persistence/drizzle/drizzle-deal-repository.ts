import { dealStatusSchema, type ListDealsQuery } from "@sales/shared";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { logger } from "../../../../utils/logger.ts";
import { leadToDomain } from "../../../lead/persistence/drizzle/drizzle-lead-repository.ts";
import { leadsTable } from "../../../lead/persistence/drizzle/lead-table.ts";
import { sellerToDomain } from "../../../seller/persistence/drizzle/drizzle-seller-repository.ts";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";
import { Deal } from "../../deal.ts";
import { reorderDealIds } from "../../deal-order.ts";
import type {
  DealRepository,
  DealWithRelations,
  MoveDealParams,
} from "../../deal-repository.ts";
import { dealsTable } from "./deal-table.ts";

export class DrizzleDealRepository implements DealRepository {
  private readonly db: NodePgDatabase<Record<string, never>>;

  constructor(db: NodePgDatabase<Record<string, never>>) {
    this.db = db;
  }

  async create(deal: Deal) {
    await this.db.insert(dealsTable).values({
      createdAt: deal.createdAt,
      description: deal.description,
      expectedCloseDate: deal.expectedCloseDate,
      id: deal.id,
      leadId: deal.leadId,
      // Negócio novo entra no topo do board. Como a ordenação é `position DESC`,
      // basta superar o maior valor existente — sem renumerar nada.
      position: sql`(SELECT COALESCE(MAX("position"), 0) + 1 FROM "deals")`,
      responsibleId: deal.responsibleId,
      status: deal.status,
      title: deal.title,
      updatedAt: deal.updatedAt,
      value: deal.value === null ? null : deal.value.toFixed(2),
    });
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.id, id))
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async search(filters: ListDealsQuery): Promise<DealWithRelations[]> {
    const conditions: SQL[] = [];

    if (filters.leadId) {
      conditions.push(eq(dealsTable.leadId, filters.leadId));
    }

    if (filters.name) {
      const nameFilter = or(
        ilike(leadsTable.fullName, `%${filters.name}%`),
        ilike(leadsTable.companyName, `%${filters.name}%`)
      );
      if (nameFilter) {
        conditions.push(nameFilter);
      }
    }

    if (filters.responsibleId) {
      conditions.push(eq(dealsTable.responsibleId, filters.responsibleId));
    }

    if (filters.status) {
      conditions.push(eq(dealsTable.status, filters.status));
    }

    if (filters.title) {
      conditions.push(ilike(dealsTable.title, `%${filters.title}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({ deal: dealsTable, lead: leadsTable, responsible: sellersTable })
      .from(dealsTable)
      .innerJoin(leadsTable, eq(leadsTable.id, dealsTable.leadId))
      .innerJoin(sellersTable, eq(sellersTable.id, dealsTable.responsibleId))
      .where(where)
      .orderBy(desc(dealsTable.position), desc(dealsTable.id));

    return rows.map(toDomainWithRelations);
  }

  move({
    afterDealId,
    dealId,
    status,
  }: MoveDealParams): Promise<DealWithRelations> {
    // Primeira transação do projeto: um drag muda status e ordem juntos, e a
    // renumeração toca várias linhas — sem transação o board ficaria com
    // posições duplicadas no meio da requisição.
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({
          id: dealsTable.id,
          position: dealsTable.position,
          status: dealsTable.status,
        })
        .from(dealsTable)
        .orderBy(desc(dealsTable.position), desc(dealsTable.id));

      const moved = rows.find((row) => row.id === dealId);
      if (!moved) {
        throw new Error("Deal not found after move");
      }

      const reordered = reorderDealIds(
        rows.map((row) => row.id),
        dealId,
        afterDealId
      );

      if (moved.status !== status) {
        logger.info(
          { dealId, fromStatus: moved.status, toStatus: status },
          "Deal status changed by move"
        );
      }

      const currentPosition = new Map(
        rows.map((row) => [row.id, row.position])
      );
      // `reordered` está em ordem de exibição e a ordenação do board é
      // `position DESC`: o primeiro da lista recebe o maior `position`.
      const changed = reordered
        .map((id, index) => ({ id, position: reordered.length - index }))
        .filter((row) => currentPosition.get(row.id) !== row.position);

      await Promise.all(
        changed.map((row) =>
          tx
            .update(dealsTable)
            .set({ position: row.position })
            .where(eq(dealsTable.id, row.id))
        )
      );

      const [updated] = await tx
        .update(dealsTable)
        .set({ status, updatedAt: new Date() })
        .where(eq(dealsTable.id, dealId))
        .returning();

      const [relations] = await tx
        .select({ lead: leadsTable, responsible: sellersTable })
        .from(dealsTable)
        .innerJoin(leadsTable, eq(leadsTable.id, dealsTable.leadId))
        .innerJoin(sellersTable, eq(sellersTable.id, dealsTable.responsibleId))
        .where(eq(dealsTable.id, dealId))
        .limit(1);

      if (!(updated && relations)) {
        throw new Error("Deal not found after move");
      }

      return toDomainWithRelations({ deal: updated, ...relations });
    });
  }

  async update(deal: Deal): Promise<DealWithRelations> {
    const [row] = await this.db
      .update(dealsTable)
      .set({
        description: deal.description,
        expectedCloseDate: deal.expectedCloseDate,
        responsibleId: deal.responsibleId,
        status: deal.status,
        title: deal.title,
        updatedAt: deal.updatedAt,
        value: deal.value === null ? null : deal.value.toFixed(2),
      })
      .where(eq(dealsTable.id, deal.id))
      .returning();

    const [relations] = await this.db
      .select({ lead: leadsTable, responsible: sellersTable })
      .from(dealsTable)
      .innerJoin(leadsTable, eq(leadsTable.id, dealsTable.leadId))
      .innerJoin(sellersTable, eq(sellersTable.id, dealsTable.responsibleId))
      .where(eq(dealsTable.id, deal.id))
      .limit(1);

    if (!(row && relations)) {
      throw new Error("Deal not found after update");
    }

    return toDomainWithRelations({ deal: row, ...relations });
  }
}

function toDomainWithRelations(row: {
  deal: typeof dealsTable.$inferSelect;
  lead: typeof leadsTable.$inferSelect;
  responsible: typeof sellersTable.$inferSelect;
}): DealWithRelations {
  return {
    deal: toDomain(row.deal),
    lead: leadToDomain(row.lead),
    responsible: sellerToDomain(row.responsible),
  };
}

function toDomain(row: typeof dealsTable.$inferSelect) {
  return Deal.fromPersistence(
    {
      description: row.description,
      expectedCloseDate: row.expectedCloseDate?.toISOString() ?? null,
      leadId: row.leadId,
      responsibleId: row.responsibleId,
      status: dealStatusSchema.parse(row.status),
      title: row.title,
      value: row.value === null ? null : Number(row.value),
    },
    row.id,
    { createdAt: row.createdAt, updatedAt: row.updatedAt }
  );
}
