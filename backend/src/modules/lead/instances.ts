import { db } from "../../config/db.ts";
import { sellerRepository } from "../seller/instances.ts";
import { LeadPolicies } from "./lead-policies.ts";
import { DrizzleLeadRepository } from "./persistence/drizzle/drizzle-lead-repository.ts";
import { CreateLeadUseCase } from "./use-cases/create-lead-use-case.ts";

export const leadRepository = new DrizzleLeadRepository(db);
export const leadPolicies = new LeadPolicies(leadRepository, sellerRepository);
export const createLeadUseCase = new CreateLeadUseCase(
  leadRepository,
  leadPolicies
);
