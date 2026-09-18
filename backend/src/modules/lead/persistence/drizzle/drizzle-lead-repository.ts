import { leadSourceSchema } from "@sales/shared";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Lead } from "../../lead.ts";
import type { LeadRepository } from "../../lead-repository.ts";
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

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

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
}
