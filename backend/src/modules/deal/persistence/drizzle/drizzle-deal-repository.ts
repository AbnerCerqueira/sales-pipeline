import { dealStatusSchema, type ListDealsQuery } from "@sales/shared";
import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { leadToDomain } from "../../../lead/persistence/drizzle/drizzle-lead-repository.ts";
import { leadsTable } from "../../../lead/persistence/drizzle/lead-table.ts";
import { sellerToDomain } from "../../../seller/persistence/drizzle/drizzle-seller-repository.ts";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";
import { Deal } from "../../deal.ts";
import type {
  DealRepository,
  DealWithRelations,
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
      .orderBy(desc(dealsTable.updatedAt), desc(dealsTable.id));

    return rows.map(toDomainWithRelations);
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
      expectedCloseDate: row.expectedCloseDate,
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
