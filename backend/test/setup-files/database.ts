import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../../src/config/envs.ts";
import { sellersTable } from "../../src/modules/seller/persistence/drizzle/seller-table.ts";

const db = drizzle(env.DATABASE_URL);

const tables = [sellersTable];

beforeEach(async () => {
  await Promise.all(tables.map((table) => db.delete(table)));
});
