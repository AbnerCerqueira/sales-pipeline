import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createSellerViaHttp, listSellersViaHttp } from "./helpers.ts";

describe("List Sellers", () => {
  test("returns all sellers", async () => {
    const first = await createSellerViaHttp();
    const second = await createSellerViaHttp();

    const response = await listSellersViaHttp();

    expect(response.statusCode).toBe(HttpStatus.OK);

    const sellers = response.json<{ email: string }[]>();
    const emails = sellers.map((seller) => seller.email);

    expect(emails).toHaveLength(2);
    expect(emails).toContain(first.email);
    expect(emails).toContain(second.email);
  });

  test("does not return password in response", async () => {
    await createSellerViaHttp();

    const response = await listSellersViaHttp();

    const sellers = response.json<Record<string, unknown>[]>();

    for (const seller of sellers) {
      expect(seller.password).toBeUndefined();
    }
  });
});
