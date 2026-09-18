import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Seller } from "../../seller.ts";
import type { SellerRepository } from "../../seller-repository.ts";
import { sellersTable } from "./seller-table.ts";

export class DrizzleSellerRepository implements SellerRepository {
  private readonly db: NodePgDatabase<Record<string, never>>;

  constructor(db: NodePgDatabase<Record<string, never>>) {
    this.db = db;
  }

  async create(seller: Seller) {
    await this.db.insert(sellersTable).values({
      createdAt: seller.createdAt,
      email: seller.email,
      id: seller.id,
      name: seller.name,
      password: seller.password,
      updatedAt: seller.updatedAt,
    });
  }

  async findByEmail(email: string) {
    const [row] = await this.db
      .select()
      .from(sellersTable)
      .where(eq(sellersTable.email, email))
      .limit(1);

    if (!row) {
      return null;
    }

    return sellerToDomain(row);
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(sellersTable)
      .where(eq(sellersTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return sellerToDomain(row);
  }

  async findMany() {
    const rows = await this.db
      .select()
      .from(sellersTable)
      .orderBy(sellersTable.name);

    return rows.map(sellerToDomain);
  }
}

export function sellerToDomain(row: typeof sellersTable.$inferSelect) {
  return Seller.fromPersistence(
    {
      email: row.email,
      name: row.name,
      password: row.password,
    },
    row.id,
    { createdAt: row.createdAt, updatedAt: row.updatedAt }
  );
}
