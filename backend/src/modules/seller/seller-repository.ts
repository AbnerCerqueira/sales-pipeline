import type { Seller } from "./seller.ts";

export interface SellerRepository {
  save: (seller: Seller) => Promise<Seller>;
}
