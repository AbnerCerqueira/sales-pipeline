import { dealStatusSchema } from "@sales/shared";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Deal } from "../../deal.ts";
import type { DealRepository } from "../../deal-repository.ts";
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
