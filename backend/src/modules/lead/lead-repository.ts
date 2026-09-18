import type { PaginatedResult, SearchLeadsQuery } from "@sales/shared";
import type { Seller } from "../seller/seller.ts";
import type { Lead } from "./lead.ts";

export type LeadWithResponsible = {
  lead: Lead;
  responsible: Seller;
};

export interface LeadRepository {
  create: (lead: Lead) => Promise<void>;
  findByEmail: (email: string) => Promise<Lead | null>;
  findById: (id: string) => Promise<Lead | null>;
  search: (
    filters: SearchLeadsQuery
  ) => Promise<PaginatedResult<LeadWithResponsible>>;
}
