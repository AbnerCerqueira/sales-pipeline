import { db } from "../../config/db.ts";
import { leadRepository } from "../lead/instances.ts";
import { sellerRepository } from "../seller/instances.ts";
import { DealPolicies } from "./deal-policies.ts";
import { DrizzleDealRepository } from "./persistence/drizzle/drizzle-deal-repository.ts";
import { CreateDealUseCase } from "./use-cases/create-deal-use-case.ts";

export const dealRepository = new DrizzleDealRepository(db);
export const dealPolicies = new DealPolicies(leadRepository, sellerRepository);
export const createDealUseCase = new CreateDealUseCase(
  dealRepository,
  dealPolicies
);
