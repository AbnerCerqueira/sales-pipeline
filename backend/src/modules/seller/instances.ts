import { db } from "../../config/db.ts";
import { BcryptPasswordHasher } from "../../lib/bcrypt-password-hasher.ts";
import { DrizzleSellerRepository } from "./persistence/drizzle/drizzle-seller-repository.ts";
import { SellerPolicies } from "./seller-policies.ts";
import { LoginUseCase } from "./use-cases/login-use-case.ts";
import { RegisterUseCase } from "./use-cases/register-use-case.ts";

export const sellerRepository = new DrizzleSellerRepository(db);
export const passwordHasher = new BcryptPasswordHasher();
export const sellerPolicies = new SellerPolicies(
  passwordHasher,
  sellerRepository
);
export const loginUseCase = new LoginUseCase(sellerRepository, sellerPolicies);
export const registerUseCase = new RegisterUseCase(
  sellerRepository,
  passwordHasher,
  sellerPolicies
);
