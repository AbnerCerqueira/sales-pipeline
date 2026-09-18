import type { Seller } from "../../src/modules/seller/seller.ts";
import type { SellerRepository } from "../../src/modules/seller/seller-repository.ts";

export class MockSellerRepository implements SellerRepository {
  private existingSeller: Seller | null = null;

  willFind(seller: Seller | null) {
    this.existingSeller = seller;
  }

  create() {
    return Promise.resolve();
  }

  findByEmail() {
    return Promise.resolve(this.existingSeller);
  }

  findById() {
    return Promise.resolve(this.existingSeller);
  }

  findMany() {
    return Promise.resolve([]);
  }
}
