import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { leadsTable } from "../../../lead/persistence/drizzle/lead-table.ts";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";

export const dealsTable = pgTable("deals", {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  description: text(),
  expectedCloseDate: timestamp("expected_close_date", {
    withTimezone: true,
  }),
  id: uuid().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadsTable.id),
  // Ranking global do board: quanto maior, mais perto do topo. Ver ADR features/003.
  position: integer("position").notNull(),
  responsibleId: uuid("responsible_id")
    .notNull()
    .references(() => sellersTable.id),
  status: text().notNull().default("open"),
  title: text().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  value: numeric("value", { precision: 12, scale: 2 }),
});
