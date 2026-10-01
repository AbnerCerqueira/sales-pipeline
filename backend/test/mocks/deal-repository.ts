import type { ListDealsQuery } from "@sales/shared";
import type { Deal } from "../../src/modules/deal/deal.ts";
import type {
  DealRepository,
  DealWithRelations,
  MoveDealParams,
} from "../../src/modules/deal/deal-repository.ts";

export class MockDealRepository implements DealRepository {
  private existingDeal: Deal | null = null;

  willFind(deal: Deal | null) {
    this.existingDeal = deal;
  }

  create() {
    return Promise.resolve();
  }

  findById() {
    return Promise.resolve(this.existingDeal);
  }

  move(_params: MoveDealParams): Promise<DealWithRelations> {
    return Promise.reject(new Error("MockDealRepository.move not implemented"));
  }

  search(_filters: ListDealsQuery): Promise<DealWithRelations[]> {
    return Promise.resolve([]);
  }

  update(_deal: Deal): Promise<DealWithRelations> {
    return Promise.reject(
      new Error("MockDealRepository.update not implemented")
    );
  }
}
