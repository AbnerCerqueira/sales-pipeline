import type { SellerDTO } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import { SellerNotFoundError } from "../seller-policies.ts";
import type { SellerRepository } from "../seller-repository.ts";

export class GetMeUseCase {
  private readonly sellerRepository: SellerRepository;

  constructor(sellerRepository: SellerRepository) {
    this.sellerRepository = sellerRepository;
  }

  async execute(id: string): Promise<SellerDTO> {
    const seller = await this.sellerRepository.findById(id);

    if (!seller) {
      throw new SellerNotFoundError();
    }

    logger.debug({ sellerId: id }, "Authenticated seller fetched");

    return seller.toDTO();
  }
}
