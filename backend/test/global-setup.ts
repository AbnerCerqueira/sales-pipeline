import { execSync } from "node:child_process";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { withDatabase } from "./utils/database-url.ts";

const TEMPLATE_DATABASE = "sales_pipeline_template";

export default async function setup() {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const adminUrl = container.getConnectionUri();

  const adminPool = new Pool({ connectionString: adminUrl });
  await adminPool.query(`CREATE DATABASE "${TEMPLATE_DATABASE}"`);
  await adminPool.end();

  execSync("npx drizzle-kit push --force", {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: withDatabase(adminUrl, TEMPLATE_DATABASE),
    },
    stdio: "inherit",
  });

  process.env.TEST_DATABASE_URL = adminUrl;

  return async function teardown() {
    await container.stop();
  };
}
