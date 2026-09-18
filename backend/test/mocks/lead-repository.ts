import type { PaginatedResult } from "@sales/shared";
import type { Lead } from "../../src/modules/lead/lead.ts";
import type {
  LeadRepository,
  LeadWithResponsible,
} from "../../src/modules/lead/lead-repository.ts";

export class MockLeadRepository implements LeadRepository {
  private existingLead: Lead | null = null;

  willFind(lead: Lead | null) {
    this.existingLead = lead;
  }

  create() {
    return Promise.resolve();
  }

  findByEmail() {
    return Promise.resolve(this.existingLead);
  }

  findById() {
    return Promise.resolve(this.existingLead);
  }

  search(): Promise<PaginatedResult<LeadWithResponsible>> {
    return Promise.resolve({ items: [], page: 1, pageSize: 10, total: 0 });
  }
}
