import type { Deal } from "./deal.ts";

export interface DealRepository {
  create: (deal: Deal) => Promise<void>;
  findById: (id: string) => Promise<Deal | null>;
}
