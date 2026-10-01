import { describe, expect, it } from "vitest";
import {
  CommentAuthorNotFoundError,
  CommentDealNotFoundError,
  CommentPolicies,
} from "../../../src/modules/comment/comment-policies.ts";
import { Deal } from "../../../src/modules/deal/deal.ts";
import { Seller } from "../../../src/modules/seller/seller.ts";
import { MockDealRepository } from "../../mocks/deal-repository.ts";
import { MockSellerRepository } from "../../mocks/seller-repository.ts";

function createDeal() {
  return Deal.create({
    description: null,
    expectedCloseDate: null,
    leadId: "lead-id",
    responsibleId: "seller-id",
    status: "open",
    title: "Deal de teste",
    value: null,
  });
}

function createSeller() {
  return Seller.create({
    email: "author@example.com",
    name: "Author",
    password: "x",
  });
}

describe("CommentPolicies", () => {
  describe("assertDealExists", () => {
    it("returns the deal when it exists", async () => {
      const dealRepository = new MockDealRepository();
      const sellerRepository = new MockSellerRepository();
      const deal = createDeal();
      dealRepository.willFind(deal);
      const policies = new CommentPolicies(dealRepository, sellerRepository);

      await expect(policies.assertDealExists(deal.id)).resolves.toBe(deal);
    });

    it("throws CommentDealNotFoundError when deal does not exist", async () => {
      const dealRepository = new MockDealRepository();
      const sellerRepository = new MockSellerRepository();
      const policies = new CommentPolicies(dealRepository, sellerRepository);

      await expect(policies.assertDealExists("missing-id")).rejects.toSatisfy(
        (error) => {
          expect(error).toBeInstanceOf(CommentDealNotFoundError);
          expect(error.statusCode).toBe(404);
          expect(error.message).toBe("Deal não encontrado");
          return true;
        }
      );
    });
  });

  describe("assertAuthorExists", () => {
    it("returns the seller when it exists", async () => {
      const dealRepository = new MockDealRepository();
      const sellerRepository = new MockSellerRepository();
      const seller = createSeller();
      sellerRepository.willFind(seller);
      const policies = new CommentPolicies(dealRepository, sellerRepository);

      await expect(policies.assertAuthorExists(seller.id)).resolves.toBe(
        seller
      );
    });

    it("throws CommentAuthorNotFoundError when seller does not exist", async () => {
      const dealRepository = new MockDealRepository();
      const sellerRepository = new MockSellerRepository();
      const policies = new CommentPolicies(dealRepository, sellerRepository);

      await expect(policies.assertAuthorExists("missing-id")).rejects.toSatisfy(
        (error) => {
          expect(error).toBeInstanceOf(CommentAuthorNotFoundError);
          expect(error.statusCode).toBe(404);
          expect(error.message).toBe("Seller autor não encontrado");
          return true;
        }
      );
    });
  });
});
