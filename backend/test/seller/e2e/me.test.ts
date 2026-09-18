import { eq } from "drizzle-orm";
import { db } from "../../../src/config/db.ts";
import { sellersTable } from "../../../src/modules/seller/persistence/drizzle/seller-table.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { getMeViaHttp, registerAndLogin } from "./helpers.ts";

describe("Get Me Seller", () => {
  test("returns the authenticated seller", async () => {
    const { seller, token } = await registerAndLogin();

    const response = await getMeViaHttp(token);

    expect(response.statusCode).toBe(HttpStatus.OK);

    const body = response.json<{
      email: string;
      id: string;
      name: string;
      password?: string;
    }>();

    expect(body.id).toBeDefined();
    expect(body.email).toBe(seller.email);
    expect(body.name).toBe(seller.name);
    expect(body.password).toBeUndefined();
  });

  test("returns 401 when token is missing", async () => {
    const response = await getMeViaHttp();

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  test("returns 401 when token is invalid", async () => {
    const response = await getMeViaHttp("not-a-valid-token");

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  test("returns 404 when the authenticated seller no longer exists", async () => {
    const { seller, token } = await registerAndLogin();

    await db.delete(sellersTable).where(eq(sellersTable.email, seller.email));

    const response = await getMeViaHttp(token);

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
