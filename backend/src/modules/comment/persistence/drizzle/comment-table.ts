import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { dealsTable } from "../../../deal/persistence/drizzle/deal-table.ts";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";

export const commentsTable = pgTable("comments", {
  content: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  dealId: uuid("deal_id")
    .notNull()
    .references(() => dealsTable.id),
  id: uuid().primaryKey(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellersTable.id),
});
