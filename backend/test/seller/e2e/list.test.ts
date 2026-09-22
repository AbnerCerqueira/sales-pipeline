import { HttpStatus } from "../../../src/utils/http-status.ts";
import {
  createSellerViaHttp,
  listSellersViaHttp,
  registerAndLogin,
} from "./helpers.ts";

describe("List Sellers", () => {
  test("returns all sellers", async () => {
    const { seller: authenticated, token } = await registerAndLogin();
    const other = await createSellerViaHttp();

    const response = await listSellersViaHttp(token);

    expect(response.statusCode).toBe(HttpStatus.OK);

    const sellers = response.json<{ email: string }[]>();
    const emails = sellers.map((seller) => seller.email);

    expect(emails).toHaveLength(2);
    expect(emails).toContain(authenticated.email);
    expect(emails).toContain(other.email);
  });

  test("does not return password in response", async () => {
    const { token } = await registerAndLogin();
    await createSellerViaHttp();

    const response = await listSellersViaHttp(token);

    const sellers = response.json<Record<string, unknown>[]>();

    for (const seller of sellers) {
      expect(seller.password).toBeUndefined();
    }
  });

  test("returns 401 when token is missing", async () => {
    const response = await listSellersViaHttp();

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });
});
