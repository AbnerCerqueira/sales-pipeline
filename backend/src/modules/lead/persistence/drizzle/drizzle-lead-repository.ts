import {
  leadSourceSchema,
  type PaginatedResult,
  type SearchLeadsQuery,
} from "@sales/shared";
import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sellerToDomain } from "../../../seller/persistence/drizzle/drizzle-seller-repository.ts";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";
import { Lead } from "../../lead.ts";
import type {
  LeadRepository,
  LeadWithResponsible,
} from "../../lead-repository.ts";
import { leadsTable } from "./lead-table.ts";

export class DrizzleLeadRepository implements LeadRepository {
  private readonly db: NodePgDatabase<Record<string, never>>;

  constructor(db: NodePgDatabase<Record<string, never>>) {
    this.db = db;
  }

  async create(lead: Lead) {
    await this.db.insert(leadsTable).values({
      companyName: lead.companyName,
      createdAt: lead.createdAt,
      description: lead.description,
      email: lead.email,
      fullName: lead.fullName,
      id: lead.id,
      location: lead.location,
      responsibleId: lead.responsibleId,
      source: lead.source,
      updatedAt: lead.updatedAt,
      whatsapp: lead.whatsapp,
    });
  }

  async findByEmail(email: string) {
    const [row] = await this.db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.email, email))
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id))
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async search(
    filters: SearchLeadsQuery
  ): Promise<PaginatedResult<LeadWithResponsible>> {
    const conditions: SQL[] = [];

    if (filters.name) {
      conditions.push(ilike(leadsTable.fullName, `%${filters.name}%`));
    }

    if (filters.responsibleId) {
      conditions.push(eq(leadsTable.responsibleId, filters.responsibleId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({ lead: leadsTable, responsible: sellersTable })
      .from(leadsTable)
      .innerJoin(sellersTable, eq(sellersTable.id, leadsTable.responsibleId))
      .where(where)
      .orderBy(desc(leadsTable.createdAt), desc(leadsTable.id))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    const total = await this.db.$count(leadsTable, where);

    return {
      items: rows.map(({ lead, responsible }) => ({
        lead: toDomain(lead),
        responsible: sellerToDomain(responsible),
      })),
      page: filters.page,
      pageSize: filters.pageSize,
      total,
    };
  }
}

function toDomain(row: typeof leadsTable.$inferSelect) {
  return Lead.fromPersistence(
    {
      companyName: row.companyName,
      description: row.description,
      email: row.email,
      fullName: row.fullName,
      location: row.location,
      responsibleId: row.responsibleId,
      source: leadSourceSchema.parse(row.source),
      whatsapp: row.whatsapp,
    },
    row.id,
    { createdAt: row.createdAt, updatedAt: row.updatedAt }
  );
}
