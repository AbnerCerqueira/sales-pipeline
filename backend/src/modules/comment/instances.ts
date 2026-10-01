import { db } from "../../config/db.ts";
import { dealRepository } from "../deal/instances.ts";
import { sellerRepository } from "../seller/instances.ts";
import { CommentPolicies } from "./comment-policies.ts";
import { DrizzleCommentRepository } from "./persistence/drizzle/drizzle-comment-repository.ts";
import { CreateCommentUseCase } from "./use-cases/create-comment-use-case.ts";
import { ListCommentsUseCase } from "./use-cases/list-comments-use-case.ts";

export const commentRepository = new DrizzleCommentRepository(db);
export const commentPolicies = new CommentPolicies(
  dealRepository,
  sellerRepository
);
export const createCommentUseCase = new CreateCommentUseCase(
  commentPolicies,
  commentRepository
);
export const listCommentsUseCase = new ListCommentsUseCase(commentRepository);
