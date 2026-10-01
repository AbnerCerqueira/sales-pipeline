import type { Seller } from "../seller/seller.ts";
import type { Comment } from "./comment.ts";

export type CommentWithSeller = {
  comment: Comment;
  seller: Seller;
};

export interface CommentRepository {
  create: (comment: Comment) => Promise<void>;
  findByDealId: (dealId: string) => Promise<CommentWithSeller[]>;
}
