import { ApplicationError } from "../../utils/errors.ts";
import type { Seller } from "./seller.ts";
import type { SellerRepository } from "./seller-repository.ts";
import type { PasswordHasher } from "./services/password-hasher.ts";

export class InvalidCredentialsError extends ApplicationError {
  constructor() {
    super(401, "Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class EmailTakenError extends ApplicationError {
  constructor() {
    super(409, "Email already taken");
    this.name = "EmailTakenError";
  }
}

export class SellerPolicies {
  private readonly passwordHasher: PasswordHasher;
  private readonly sellerRepository: SellerRepository;

  constructor(
    passwordHasher: PasswordHasher,
    sellerRepository: SellerRepository
  ) {
    this.passwordHasher = passwordHasher;
    this.sellerRepository = sellerRepository;
  }

  async assertCredentials(seller: Seller, password: string): Promise<void> {
    const passwordMatch = await this.passwordHasher.compare(
      password,
      seller.password
    );

    if (!passwordMatch) {
      throw new InvalidCredentialsError();
    }
  }

  async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.sellerRepository.findByEmail(email);

    if (existing) {
      throw new EmailTakenError();
    }
  }
}
