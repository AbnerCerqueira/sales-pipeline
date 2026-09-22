import { describe, expect, it } from "vitest";
import {
  DealLeadNotFoundError,
  DealPolicies,
  DealResponsibleNotFoundError,
} from "../../../src/modules/deal/deal-policies.ts";
import { Lead } from "../../../src/modules/lead/lead.ts";
import { Seller } from "../../../src/modules/seller/seller.ts";
import { MockLeadRepository } from "../../mocks/lead-repository.ts";
import { MockSellerRepository } from "../../mocks/seller-repository.ts";

function createLead() {
  return Lead.create({
    companyName: "Acme",
    description: null,
    email: "lead@example.com",
    fullName: "John Lead",
    responsibleId: "seller-id",
    source: "inbound",
    whatsapp: "(11) 99999-0000",
  });
}

describe("DealPolicies", () => {
  describe("assertLeadExists", () => {
    it("returns the lead when it exists", async () => {
      const leadRepository = new MockLeadRepository();
      const sellerRepository = new MockSellerRepository();
      const lead = createLead();
      leadRepository.willFind(lead);
      const policies = new DealPolicies(leadRepository, sellerRepository);

      await expect(policies.assertLeadExists(lead.id)).resolves.toBe(lead);
    });

    it("throws DealLeadNotFoundError when lead does not exist", async () => {
      const leadRepository = new MockLeadRepository();
      const sellerRepository = new MockSellerRepository();
      const policies = new DealPolicies(leadRepository, sellerRepository);

      await expect(policies.assertLeadExists("missing-id")).rejects.toSatisfy(
        (error) => {
          expect(error).toBeInstanceOf(DealLeadNotFoundError);
          expect(error.statusCode).toBe(404);
          expect(error.message).toBe("Lead não encontrado");
          return true;
        }
      );
    });
  });

  describe("assertResponsibleExists", () => {
    it("returns the seller when it exists", async () => {
      const leadRepository = new MockLeadRepository();
      const sellerRepository = new MockSellerRepository();
      const seller = Seller.create({
        email: "s@example.com",
        name: "Seller",
        password: "x",
      });
      sellerRepository.willFind(seller);
      const policies = new DealPolicies(leadRepository, sellerRepository);

      await expect(policies.assertResponsibleExists("seller-id")).resolves.toBe(
        seller
      );
    });

    it("throws DealResponsibleNotFoundError when seller does not exist", async () => {
      const leadRepository = new MockLeadRepository();
      const sellerRepository = new MockSellerRepository();
      const policies = new DealPolicies(leadRepository, sellerRepository);

      await expect(
        policies.assertResponsibleExists("missing-id")
      ).rejects.toSatisfy((error) => {
        expect(error).toBeInstanceOf(DealResponsibleNotFoundError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Seller responsável não encontrado");
        return true;
      });
    });
  });
});
