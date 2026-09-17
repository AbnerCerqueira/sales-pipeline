import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const sellersTable = pgTable("sellers", {
  createdAt: timestamp("created_at", { withTimezone: false }).notNull(),
  email: text().notNull().unique(),
  id: uuid().primaryKey(),
  name: text().notNull(),
  password: text().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull(),
});
