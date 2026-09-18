import type { Lead } from "./lead.ts";

export interface LeadRepository {
  create: (lead: Lead) => Promise<void>;
  findById: (id: string) => Promise<Lead | null>;
}
