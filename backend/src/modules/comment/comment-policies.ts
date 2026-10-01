import { ApplicationError } from "../../utils/errors.ts";
import { HttpStatus } from "../../utils/http-status.ts";
import type { Deal } from "../deal/deal.ts";
import type { DealRepository } from "../deal/deal-repository.ts";
import type { Seller } from "../seller/seller.ts";
import type { SellerRepository } from "../seller/seller-repository.ts";

export class CommentDealNotFoundError extends ApplicationError {
  constructor() {
    super(HttpStatus.NOT_FOUND, "Deal não encontrado");
    this.name = "CommentDealNotFoundError";
  }
}

export class CommentAuthorNotFoundError extends ApplicationError {
  constructor() {
    super(HttpStatus.NOT_FOUND, "Seller autor não encontrado");
    this.name = "CommentAuthorNotFoundError";
  }
}

export class CommentPolicies {
  private readonly dealRepository: DealRepository;
  private readonly sellerRepository: SellerRepository;

  constructor(
    dealRepository: DealRepository,
    sellerRepository: SellerRepository
  ) {
    this.dealRepository = dealRepository;
    this.sellerRepository = sellerRepository;
  }

  async assertDealExists(dealId: string): Promise<Deal> {
    const deal = await this.dealRepository.findById(dealId);
    if (!deal) {
      throw new CommentDealNotFoundError();
    }
    return deal;
  }

  async assertAuthorExists(sellerId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) {
      throw new CommentAuthorNotFoundError();
    }
    return seller;
  }
}
