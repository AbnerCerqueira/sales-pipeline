import { ApplicationError } from "../../utils/errors.ts";
import { HttpStatus } from "../../utils/http-status.ts";
import type { Seller } from "../seller/seller.ts";
import type { SellerRepository } from "../seller/seller-repository.ts";
import type { LeadRepository } from "./lead-repository.ts";

export class ResponsibleSellerNotFoundError extends ApplicationError {
  constructor() {
    super(HttpStatus.NOT_FOUND, "Seller responsável não encontrado");
    this.name = "ResponsibleSellerNotFoundError";
  }
}

export class LeadEmailTakenError extends ApplicationError {
  constructor() {
    super(HttpStatus.CONFLICT, "Já existe um lead com este e-mail");
    this.name = "LeadEmailTakenError";
  }
}

export class LeadPolicies {
  private readonly leadRepository: LeadRepository;
  private readonly sellerRepository: SellerRepository;

  constructor(
    leadRepository: LeadRepository,
    sellerRepository: SellerRepository
  ) {
    this.leadRepository = leadRepository;
    this.sellerRepository = sellerRepository;
  }

  async assertResponsibleExists(responsibleId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findById(responsibleId);

    if (!seller) {
      throw new ResponsibleSellerNotFoundError();
    }

    return seller;
  }

  async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.leadRepository.findByEmail(email);

    if (existing) {
      throw new LeadEmailTakenError();
    }
  }
}
