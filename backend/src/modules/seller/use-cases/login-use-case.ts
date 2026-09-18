import type { LoginInput, SellerDTO } from "@sales/shared";
import type { SellerPolicies } from "../seller-policies.ts";
import { InvalidCredentialsError } from "../seller-policies.ts";
import type { SellerRepository } from "../seller-repository.ts";

export class LoginUseCase {
  private readonly sellerRepository: SellerRepository;
  private readonly sellerPolicies: SellerPolicies;

  constructor(
    sellerRepository: SellerRepository,
    sellerPolicies: SellerPolicies
  ) {
    this.sellerRepository = sellerRepository;
    this.sellerPolicies = sellerPolicies;
  }

  async execute(input: LoginInput): Promise<SellerDTO> {
    const seller = await this.sellerRepository.findByEmail(input.email);

    if (!seller) {
      throw new InvalidCredentialsError();
    }

    await this.sellerPolicies.assertCredentials(seller, input.password);

    return seller.toDTO();
  }
}
