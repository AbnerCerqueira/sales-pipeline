import type { DealStatus, ListDealsQuery } from "@sales/shared";
import type { Lead } from "../lead/lead.ts";
import type { Seller } from "../seller/seller.ts";
import type { Deal } from "./deal.ts";

export type DealWithRelations = {
  deal: Deal;
  lead: Lead;
  responsible: Seller;
};

export type MoveDealParams = {
  /** Card vizinho de destino; `null` manda para o topo. */
  afterDealId: string | null;
  dealId: string;
  status: DealStatus;
};

export interface DealRepository {
  create: (deal: Deal) => Promise<void>;
  findById: (id: string) => Promise<Deal | null>;
  /** Reposiciona no board: move o status e renumera o ranking inteiro. */
  move: (params: MoveDealParams) => Promise<DealWithRelations>;
  search: (filters: ListDealsQuery) => Promise<DealWithRelations[]>;
  update: (deal: Deal) => Promise<DealWithRelations>;
}
