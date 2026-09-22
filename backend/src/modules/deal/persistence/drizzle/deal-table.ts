import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { leadsTable } from "../../../lead/persistence/drizzle/lead-table.ts";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";

export const dealsTable = pgTable("deals", {
  createdAt: timestamp("created_at", { withTimezone: false }).notNull(),
  description: text(),
  expectedCloseDate: date("expected_close_date"),
  id: uuid().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadsTable.id),
  responsibleId: uuid("responsible_id")
    .notNull()
    .references(() => sellersTable.id),
  status: text().notNull().default("open"),
  title: text().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull(),
  value: numeric("value", { precision: 12, scale: 2 }),
});
