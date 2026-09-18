import { execSync } from "node:child_process";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

export default async function setup() {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();

  process.env.DATABASE_URL = container.getConnectionUri();

  execSync("npx drizzle-kit push --force", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "inherit",
  });

  return async function teardown() {
    await container.stop();
  };
}
