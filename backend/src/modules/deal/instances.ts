import { db } from "../../config/db.ts";
import { env } from "../../config/envs.ts";
import { GeminiProvider } from "../../lib/gemini-provider.ts";
import { DrizzleCommentRepository } from "../comment/persistence/drizzle/drizzle-comment-repository.ts";
import { leadRepository } from "../lead/instances.ts";
import { sellerRepository } from "../seller/instances.ts";
import { DealPolicies } from "./deal-policies.ts";
import { DrizzleDealRepository } from "./persistence/drizzle/drizzle-deal-repository.ts";
import { CreateDealUseCase } from "./use-cases/create-deal-use-case.ts";
import { ListDealsUseCase } from "./use-cases/list-deals-use-case.ts";
import { MoveDealUseCase } from "./use-cases/move-deal-use-case.ts";
import { SummarizeDealUseCase } from "./use-cases/summarize-deal-use-case.ts";
import { UpdateDealUseCase } from "./use-cases/update-deal-use-case.ts";

export const dealRepository = new DrizzleDealRepository(db);
export const dealPolicies = new DealPolicies(leadRepository, sellerRepository);
export const createDealUseCase = new CreateDealUseCase(
  dealRepository,
  dealPolicies
);
export const listDealsUseCase = new ListDealsUseCase(dealRepository);
export const moveDealUseCase = new MoveDealUseCase(dealRepository);
export const updateDealUseCase = new UpdateDealUseCase(
  dealRepository,
  dealPolicies
);

export const aiProvider = new GeminiProvider({
  apiKey: env.AI_API_KEY,
  model: env.AI_MODEL,
});

// Repositório instanciado aqui em vez de vir de `comment/instances.ts`,
// que importa este módulo de volta (ciclo deal <-> comment).
const dealCommentRepository = new DrizzleCommentRepository(db);

export const summarizeDealUseCase = new SummarizeDealUseCase(
  dealRepository,
  leadRepository,
  dealCommentRepository,
  aiProvider
);
