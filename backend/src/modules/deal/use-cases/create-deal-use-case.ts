import type { CreateDealInput, DealDTO } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import { Deal } from "../deal.ts";
import type { DealPolicies } from "../deal-policies.ts";
import type { DealRepository } from "../deal-repository.ts";

export class CreateDealUseCase {
  private readonly dealRepository: DealRepository;
  private readonly dealPolicies: DealPolicies;

  constructor(dealRepository: DealRepository, dealPolicies: DealPolicies) {
    this.dealRepository = dealRepository;
    this.dealPolicies = dealPolicies;
  }

  async execute(input: CreateDealInput): Promise<DealDTO> {
    const lead = await this.dealPolicies.assertLeadExists(input.leadId);
    const responsibleId = input.responsibleId ?? lead.responsibleId;
    const responsible =
      await this.dealPolicies.assertResponsibleExists(responsibleId);

    const deal = Deal.create({
      description: input.description,
      expectedCloseDate: input.expectedCloseDate ?? null,
      leadId: input.leadId,
      responsibleId,
      status: input.status,
      title: input.title,
      value: input.value ?? null,
    });

    await this.dealRepository.create(deal);

    logger.info(
      { dealId: deal.id, leadId: deal.leadId, responsibleId },
      "Deal created"
    );

    return deal.toDTO(responsible.toSummary(), lead.toSummary());
  }
}
