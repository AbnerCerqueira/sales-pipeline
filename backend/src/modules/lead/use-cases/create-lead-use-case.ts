import type { CreateLeadInput, LeadDTO } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import { Lead } from "../lead.ts";
import type { LeadPolicies } from "../lead-policies.ts";
import type { LeadRepository } from "../lead-repository.ts";

export class CreateLeadUseCase {
  private readonly leadRepository: LeadRepository;
  private readonly leadPolicies: LeadPolicies;

  constructor(leadRepository: LeadRepository, leadPolicies: LeadPolicies) {
    this.leadRepository = leadRepository;
    this.leadPolicies = leadPolicies;
  }

  async execute(input: CreateLeadInput): Promise<LeadDTO> {
    const responsible = await this.leadPolicies.assertResponsibleExists(
      input.responsibleId
    );
    await this.leadPolicies.assertEmailAvailable(input.email);

    const lead = Lead.create(input);

    await this.leadRepository.create(lead);

    logger.info(
      { leadId: lead.id, responsibleId: input.responsibleId },
      "Lead created"
    );

    return lead.toDTO(responsible.toDTO());
  }
}
