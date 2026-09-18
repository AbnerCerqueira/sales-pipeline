import type { Lead } from "../../src/modules/lead/lead.ts";
import type { LeadRepository } from "../../src/modules/lead/lead-repository.ts";

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
}
