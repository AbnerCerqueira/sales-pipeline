import { dealDTOSchema } from "@sales/shared";
import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { createDealViaHttp } from "./helpers.ts";
import { DealRoutes } from "./routes.ts";

describe("GET /deal/search", () => {
  test("keeps deals ordered by creation date after an update", async () => {
    const { token } = await registerAndLogin();
    const headers = { authorization: `Bearer ${token}` };
    const first = (await createDealViaHttp({})).json<{ id: string }>();
    const second = (await createDealViaHttp({})).json<{ id: string }>();

    const initialResponse = await app.inject({
      headers,
      method: "GET",
      url: DealRoutes.GET.SEARCH,
    });

    expect(initialResponse.statusCode).toBe(HttpStatus.OK);
    const initialDeals = dealDTOSchema.array().parse(initialResponse.json());
    const expectedOrder = [second.id, first.id];
    expect(initialDeals.map((deal) => deal.id)).toEqual(expectedOrder);

    const updateResponse = await app.inject({
      headers,
      method: "PATCH",
      payload: { status: "negotiating" },
      url: DealRoutes.PATCH.UPDATE(first.id),
    });

    expect(updateResponse.statusCode).toBe(HttpStatus.OK);
    expect(dealDTOSchema.parse(updateResponse.json()).status).toBe(
      "negotiating"
    );

    const updatedResponse = await app.inject({
      headers,
      method: "GET",
      url: DealRoutes.GET.SEARCH,
    });

    expect(updatedResponse.statusCode).toBe(HttpStatus.OK);
    const updatedDeals = dealDTOSchema.array().parse(updatedResponse.json());
    expect(updatedDeals.map((deal) => deal.id)).toEqual(expectedOrder);
  });
});
