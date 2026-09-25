import type { ListDealsQuery } from "@sales/shared";
import type { Lead } from "../lead/lead.ts";
import type { Seller } from "../seller/seller.ts";
import type { Deal } from "./deal.ts";

export type DealWithRelations = {
  deal: Deal;
  lead: Lead;
  responsible: Seller;
};

export interface DealRepository {
  create: (deal: Deal) => Promise<void>;
  findById: (id: string) => Promise<Deal | null>;
  search: (filters: ListDealsQuery) => Promise<DealWithRelations[]>;
  update: (deal: Deal) => Promise<DealWithRelations>;
}
