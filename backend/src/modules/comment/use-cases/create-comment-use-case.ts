import type { CommentDTO, CreateCommentInput } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import { Comment } from "../comment.ts";
import type { CommentPolicies } from "../comment-policies.ts";
import type { CommentRepository } from "../comment-repository.ts";

export class CreateCommentUseCase {
  private readonly commentPolicies: CommentPolicies;
  private readonly commentRepository: CommentRepository;

  constructor(
    commentPolicies: CommentPolicies,
    commentRepository: CommentRepository
  ) {
    this.commentPolicies = commentPolicies;
    this.commentRepository = commentRepository;
  }

  async execute(
    sellerId: string,
    input: CreateCommentInput
  ): Promise<CommentDTO> {
    await this.commentPolicies.assertDealExists(input.dealId);
    const author = await this.commentPolicies.assertAuthorExists(sellerId);

    const comment = Comment.create({
      content: input.content,
      dealId: input.dealId,
      sellerId,
    });
    await this.commentRepository.create(comment);

    logger.info(
      { commentId: comment.id, dealId: comment.dealId, sellerId },
      "Comment created"
    );

    return comment.toDTO(author.toSummary());
  }
}
