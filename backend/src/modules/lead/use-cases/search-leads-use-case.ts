import type { SearchLeadsQuery, SearchLeadsResponse } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import type { LeadRepository } from "../lead-repository.ts";

export class SearchLeadsUseCase {
  private readonly leadRepository: LeadRepository;

  constructor(leadRepository: LeadRepository) {
    this.leadRepository = leadRepository;
  }

  async execute(query: SearchLeadsQuery): Promise<SearchLeadsResponse> {
    const { items, page, pageSize, total } =
      await this.leadRepository.search(query);

    logger.debug(
      { count: items.length, page, pageSize, total },
      "Leads searched"
    );

    return {
      items: items.map(({ lead, responsible }) =>
        lead.toDTO(responsible.toDTO())
      ),
      page,
      pageSize,
      total,
    };
  }
}
