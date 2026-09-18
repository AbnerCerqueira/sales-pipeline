import type { Seller } from "./seller.ts";

export interface SellerRepository {
  create: (seller: Seller) => Promise<void>;
  findByEmail: (email: string) => Promise<Seller | null>;
  findById: (id: string) => Promise<Seller | null>;
  findMany: () => Promise<Seller[]>;
}
