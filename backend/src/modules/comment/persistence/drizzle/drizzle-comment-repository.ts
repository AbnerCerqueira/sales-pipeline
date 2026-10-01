import { asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sellerToDomain } from "../../../seller/persistence/drizzle/drizzle-seller-repository.ts";
import { sellersTable } from "../../../seller/persistence/drizzle/seller-table.ts";
import { Comment } from "../../comment.ts";
import type {
  CommentRepository,
  CommentWithSeller,
} from "../../comment-repository.ts";
import { commentsTable } from "./comment-table.ts";

export class DrizzleCommentRepository implements CommentRepository {
  private readonly db: NodePgDatabase<Record<string, never>>;

  constructor(db: NodePgDatabase<Record<string, never>>) {
    this.db = db;
  }

  async create(comment: Comment) {
    await this.db.insert(commentsTable).values({
      content: comment.content,
      createdAt: comment.createdAt,
      dealId: comment.dealId,
      id: comment.id,
      sellerId: comment.sellerId,
    });
  }

  async findByDealId(dealId: string): Promise<CommentWithSeller[]> {
    const rows = await this.db
      .select({ comment: commentsTable, seller: sellersTable })
      .from(commentsTable)
      .innerJoin(sellersTable, eq(sellersTable.id, commentsTable.sellerId))
      .where(eq(commentsTable.dealId, dealId))
      .orderBy(asc(commentsTable.createdAt), asc(commentsTable.id));

    return rows.map(toDomainWithSeller);
  }
}

function toDomainWithSeller(row: {
  comment: typeof commentsTable.$inferSelect;
  seller: typeof sellersTable.$inferSelect;
}): CommentWithSeller {
  return {
    comment: toDomain(row.comment),
    seller: sellerToDomain(row.seller),
  };
}

function toDomain(row: typeof commentsTable.$inferSelect) {
  return Comment.fromPersistence(
    { content: row.content, dealId: row.dealId, sellerId: row.sellerId },
    row.id,
    { createdAt: row.createdAt, updatedAt: row.createdAt }
  );
}
