import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { leadsTable } from "../../src/modules/lead/persistence/drizzle/lead-table.ts";
import { sellersTable } from "../../src/modules/seller/persistence/drizzle/seller-table.ts";
import { withDatabase } from "../utils/database-url.ts";

const TEMPLATE_DATABASE = "sales_pipeline_template";
const adminUrl = process.env.TEST_DATABASE_URL;

if (!adminUrl) {
  throw new Error("TEST_DATABASE_URL is not set, did global-setup run?");
}

const databaseName = `sales_pipeline_test_${randomUUID().slice(0, 8)}`;

const adminPool = new Pool({ connectionString: adminUrl });
await adminPool.query(
  `CREATE DATABASE "${databaseName}" TEMPLATE "${TEMPLATE_DATABASE}"`
);

process.env.DATABASE_URL = withDatabase(adminUrl, databaseName);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const tables = [leadsTable, sellersTable];

beforeEach(async () => {
  await Promise.all(tables.map((table) => db.delete(table)));
});

afterAll(async () => {
  await pool.end();
  await adminPool.end();
});
