import type { SellerDTO } from "@sales/shared";
import { logger } from "../../../utils/logger.ts";
import type { SellerRepository } from "../seller-repository.ts";

export class ListSellersUseCase {
  private readonly sellerRepository: SellerRepository;

  constructor(sellerRepository: SellerRepository) {
    this.sellerRepository = sellerRepository;
  }

  async execute(): Promise<SellerDTO[]> {
    const sellers = await this.sellerRepository.findMany();

    logger.debug({ count: sellers.length }, "Sellers listed");

    return sellers.map((seller) => seller.toDTO());
  }
}
