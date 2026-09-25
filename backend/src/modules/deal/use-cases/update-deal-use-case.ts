import type { DealDTO, UpdateDealInput } from "@sales/shared";
import { ApplicationError } from "../../../utils/errors.ts";
import { HttpStatus } from "../../../utils/http-status.ts";
import { logger } from "../../../utils/logger.ts";
import type { DealPolicies } from "../deal-policies.ts";
import type { DealRepository } from "../deal-repository.ts";

export class DealNotFoundError extends ApplicationError {
  constructor() {
    super(HttpStatus.NOT_FOUND, "Deal não encontrado");
    this.name = "DealNotFoundError";
  }
}

export class UpdateDealUseCase {
  private readonly dealRepository: DealRepository;
  private readonly dealPolicies: DealPolicies;

  constructor(dealRepository: DealRepository, dealPolicies: DealPolicies) {
    this.dealRepository = dealRepository;
    this.dealPolicies = dealPolicies;
  }

  async execute(id: string, input: UpdateDealInput): Promise<DealDTO> {
    const existing = await this.dealRepository.findById(id);
    if (!existing) {
      throw new DealNotFoundError();
    }

    if (input.responsibleId) {
      await this.dealPolicies.assertResponsibleExists(input.responsibleId);
    }

    const deal = existing.mutate(input);
    const {
      deal: updated,
      lead,
      responsible,
    } = await this.dealRepository.update(deal);

    logger.info(
      {
        dealId: updated.id,
        toStatus: updated.status,
      },
      "Deal updated"
    );

    return updated.toDTO(responsible.toSummary(), lead.toSummary());
  }
}
