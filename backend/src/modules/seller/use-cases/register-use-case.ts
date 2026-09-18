import type { RegisterInput, SellerDTO } from "@sales/shared";
import { Seller } from "../seller.ts";
import type { SellerPolicies } from "../seller-policies.ts";
import type { SellerRepository } from "../seller-repository.ts";
import type { PasswordHasher } from "../services/password-hasher.ts";

export class RegisterUseCase {
  private readonly sellerRepository: SellerRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly sellerPolicies: SellerPolicies;

  constructor(
    sellerRepository: SellerRepository,
    passwordHasher: PasswordHasher,
    sellerPolicies: SellerPolicies
  ) {
    this.sellerRepository = sellerRepository;
    this.passwordHasher = passwordHasher;
    this.sellerPolicies = sellerPolicies;
  }

  async execute(input: RegisterInput): Promise<SellerDTO> {
    await this.sellerPolicies.assertEmailAvailable(input.email);

    const hashedPassword = await this.passwordHasher.hash(input.password);

    const seller = Seller.create({
      email: input.email,
      name: input.name,
      password: hashedPassword,
    });

    await this.sellerRepository.create(seller);

    return seller.toDTO();
  }
}
