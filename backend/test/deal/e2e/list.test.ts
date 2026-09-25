import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { createDealViaHttp } from "./helpers.ts";
import { DealRoutes } from "./routes.ts";

describe("GET /deal/search", () => {
  test("lists deals ordered by updated date", async () => {
    const { token } = await registerAndLogin();
    const headers = { authorization: `Bearer ${token}` };
    await createDealViaHttp();
    await createDealViaHttp();

    const response = await app.inject({
      headers,
      method: "GET",
      url: DealRoutes.GET.SEARCH,
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    const body = response.json();
    expect(body.length).toBeGreaterThanOrEqual(2);
  });
});
