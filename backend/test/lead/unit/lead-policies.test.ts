import { describe, expect, it } from "vitest";
import { Lead } from "../../../src/modules/lead/lead.ts";
import {
  LeadEmailTakenError,
  LeadPolicies,
  ResponsibleSellerNotFoundError,
} from "../../../src/modules/lead/lead-policies.ts";
import { Seller } from "../../../src/modules/seller/seller.ts";
import { MockLeadRepository } from "../../mocks/lead-repository.ts";
import { MockSellerRepository } from "../../mocks/seller-repository.ts";

function createLead() {
  return Lead.create({
    companyName: "Acme",
    description: "Potential client",
    email: "lead@example.com",
    fullName: "John Lead",
    location: "São Paulo, SP",
    responsibleId: "seller-id",
    source: "inbound",
    whatsapp: "(11) 99999-0000",
  });
}

describe("LeadPolicies", () => {
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
      const policies = new LeadPolicies(leadRepository, sellerRepository);

      await expect(policies.assertResponsibleExists("seller-id")).resolves.toBe(
        seller
      );
    });

    it("throws ResponsibleSellerNotFoundError when seller does not exist", async () => {
      const leadRepository = new MockLeadRepository();
      const sellerRepository = new MockSellerRepository();
      const policies = new LeadPolicies(leadRepository, sellerRepository);

      await expect(
        policies.assertResponsibleExists("missing-id")
      ).rejects.toSatisfy((error) => {
        expect(error).toBeInstanceOf(ResponsibleSellerNotFoundError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Seller responsável não encontrado");
        return true;
      });
    });
  });

  describe("assertEmailAvailable", () => {
    it("does not throw when email is not taken", async () => {
      const leadRepository = new MockLeadRepository();
      const sellerRepository = new MockSellerRepository();
      const policies = new LeadPolicies(leadRepository, sellerRepository);

      await expect(
        policies.assertEmailAvailable("new@example.com")
      ).resolves.toBeUndefined();
    });

    it("throws LeadEmailTakenError when email is already taken", async () => {
      const leadRepository = new MockLeadRepository();
      leadRepository.willFind(createLead());
      const sellerRepository = new MockSellerRepository();
      const policies = new LeadPolicies(leadRepository, sellerRepository);

      await expect(
        policies.assertEmailAvailable("lead@example.com")
      ).rejects.toSatisfy((error) => {
        expect(error).toBeInstanceOf(LeadEmailTakenError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe("Já existe um lead com este e-mail");
        return true;
      });
    });
  });
});
