import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";

export const leadsTable = pgTable("leads", {
  companyName: text("company_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull(),
  description: text().notNull(),
  email: text().notNull().unique(),
  fullName: text("full_name").notNull(),
  id: uuid().primaryKey(),
  location: text().notNull(),
  responsibleId: uuid("responsible_id")
    .notNull()
    .references(() => sellersTable.id),
  source: text().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull(),
  whatsapp: text().notNull(),
});
