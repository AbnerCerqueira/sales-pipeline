import type { ListDealsQuery, ListDealsResponse } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import type { DealRepository } from "../deal-repository.ts";

export class ListDealsUseCase {
  private readonly dealRepository: DealRepository;

  constructor(dealRepository: DealRepository) {
    this.dealRepository = dealRepository;
  }

  async execute(query: ListDealsQuery): Promise<ListDealsResponse> {
    const items = await this.dealRepository.search(query);

    logger.debug({ count: items.length }, "Deals listed");

    return items.map(({ deal, lead, responsible }) =>
      deal.toDTO(responsible.toSummary(), lead.toSummary())
    );
  }
}
