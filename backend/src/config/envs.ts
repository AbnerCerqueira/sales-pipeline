import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default("postgres://postgres:postgres@localhost:5432/sales_pipeline"),
  JWT_EXPIRATION: z.string().default("24h"),
  JWT_SECRET: z.string().default("super-secret-key-change-in-production"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["dev", "test", "prod"]).default("dev"),
  PORT: z.coerce.number().default(3333),
});

export const env = envSchema.parse(process.env);
