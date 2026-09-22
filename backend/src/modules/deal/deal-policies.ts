import { ApplicationError } from "../../utils/errors.ts";
import { HttpStatus } from "../../utils/http-status.ts";
import type { Lead } from "../lead/lead.ts";
import type { LeadRepository } from "../lead/lead-repository.ts";
import type { Seller } from "../seller/seller.ts";
import type { SellerRepository } from "../seller/seller-repository.ts";

export class DealLeadNotFoundError extends ApplicationError {
  constructor() {
    super(HttpStatus.NOT_FOUND, "Lead não encontrado");
    this.name = "DealLeadNotFoundError";
  }
}

export class DealResponsibleNotFoundError extends ApplicationError {
  constructor() {
    super(HttpStatus.NOT_FOUND, "Seller responsável não encontrado");
    this.name = "DealResponsibleNotFoundError";
  }
}

export class DealPolicies {
  private readonly leadRepository: LeadRepository;
  private readonly sellerRepository: SellerRepository;

  constructor(
    leadRepository: LeadRepository,
    sellerRepository: SellerRepository
  ) {
    this.leadRepository = leadRepository;
    this.sellerRepository = sellerRepository;
  }

  async assertLeadExists(leadId: string): Promise<Lead> {
    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new DealLeadNotFoundError();
    }
    return lead;
  }

  async assertResponsibleExists(responsibleId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findById(responsibleId);
    if (!seller) {
      throw new DealResponsibleNotFoundError();
    }
    return seller;
  }
}
