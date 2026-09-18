import type { Lead } from "./lead.ts";

export interface LeadRepository {
  create: (lead: Lead) => Promise<void>;
  findByEmail: (email: string) => Promise<Lead | null>;
  findById: (id: string) => Promise<Lead | null>;
}
