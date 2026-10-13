import type { DealSummaryResponse } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import type { CommentRepository } from "../../comment/comment-repository.ts";
import type { LeadRepository } from "../../lead/lead-repository.ts";
import type { DealRepository } from "../deal-repository.ts";
import type { AiProvider } from "../services/ai-provider.ts";
import { DealNotFoundError } from "./update-deal-use-case.ts";

export class SummarizeDealUseCase {
  private readonly aiProvider: AiProvider;
  private readonly commentRepository: CommentRepository;
  private readonly dealRepository: DealRepository;
  private readonly leadRepository: LeadRepository;

  constructor(
    dealRepository: DealRepository,
    leadRepository: LeadRepository,
    commentRepository: CommentRepository,
    aiProvider: AiProvider
  ) {
    this.aiProvider = aiProvider;
    this.commentRepository = commentRepository;
    this.dealRepository = dealRepository;
    this.leadRepository = leadRepository;
  }

  async execute(id: string): Promise<DealSummaryResponse> {
    const deal = await this.dealRepository.findById(id);
    if (!deal) {
      throw new DealNotFoundError();
    }

    const [lead, comments] = await Promise.all([
      this.leadRepository.findById(deal.leadId),
      this.commentRepository.findByDealId(id),
    ]);

    logger.info({ dealId: id }, "Deal summary requested");

    const summary = await this.aiProvider.summarizeDeal({
      comments: comments.map(({ comment }) => comment.content),
      description: deal.description,
      expectedCloseDate:
        deal.expectedCloseDate?.toISOString().slice(0, 10) ?? null,
      leadName: lead
        ? `${lead.fullName} (${lead.companyName})`
        : "(lead não encontrado)",
      status: deal.status,
      title: deal.title,
      value: deal.value,
    });

    return { summary };
  }
}
