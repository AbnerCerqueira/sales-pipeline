import type { ListCommentsResponse } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import type { CommentRepository } from "../comment-repository.ts";

export class ListCommentsUseCase {
  private readonly commentRepository: CommentRepository;

  constructor(commentRepository: CommentRepository) {
    this.commentRepository = commentRepository;
  }

  async execute(dealId: string): Promise<ListCommentsResponse> {
    const items = await this.commentRepository.findByDealId(dealId);

    logger.debug({ count: items.length, dealId }, "Comments listed");

    return items.map(({ comment, seller }) =>
      comment.toDTO(seller.toSummary())
    );
  }
}
