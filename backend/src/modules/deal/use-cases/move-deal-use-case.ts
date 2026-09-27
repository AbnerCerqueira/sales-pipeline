import type { DealDTO } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import type { DealRepository } from "../deal-repository.ts";
import { DealNotFoundError } from "./update-deal-use-case.ts";

export class MoveDealUseCase {
  private readonly dealRepository: DealRepository;

  constructor(dealRepository: DealRepository) {
    this.dealRepository = dealRepository;
  }

  async execute(
    id: string,
    input: { afterDealId: string | null; status: DealDTO["status"] }
  ): Promise<DealDTO> {
    const existing = await this.dealRepository.findById(id);
    if (!existing) {
      throw new DealNotFoundError();
    }

    const {
      deal: moved,
      lead,
      responsible,
    } = await this.dealRepository.move({
      afterDealId: input.afterDealId,
      dealId: id,
      status: input.status,
    });

    logger.info(
      {
        afterDealId: input.afterDealId,
        dealId: moved.id,
        fromStatus: existing.status,
        toStatus: moved.status,
      },
      "Deal moved on the board"
    );

    return moved.toDTO(responsible.toSummary(), lead.toSummary());
  }
}
