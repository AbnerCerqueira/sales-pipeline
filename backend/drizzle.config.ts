import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/envs";

export default defineConfig({
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/modules/**/persistence/*.ts",
});
