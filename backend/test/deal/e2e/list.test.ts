import { dealDTOSchema } from "@sales/shared";
import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createLeadViaHttp } from "../../lead/e2e/helpers.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { createDealViaHttp } from "./helpers.ts";
import { DealRoutes } from "./routes.ts";

describe("GET /deal/search", () => {
  test("keeps newly created deals on top after an update", async () => {
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

  test("filters deals by selected lead", async () => {
    const { token } = await registerAndLogin();
    const headers = { authorization: `Bearer ${token}` };
    const targetLead = await createLeadViaHttp({ fullName: "Ada Lovelace" });
    const otherLead = await createLeadViaHttp({ fullName: "Alan Turing" });
    const target = await createDealViaHttp({
      leadId: targetLead.json<{ id: string }>().id,
    });
    await createDealViaHttp({ leadId: otherLead.json<{ id: string }>().id });

    const response = await app.inject({
      headers,
      method: "GET",
      query: { leadId: targetLead.json<{ id: string }>().id },
      url: DealRoutes.GET.SEARCH,
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    const deals = dealDTOSchema.array().parse(response.json());
    expect(deals.map((deal) => deal.id)).toEqual([
      target.json<{ id: string }>().id,
    ]);
  });

  test("filters deals by lead name or company name", async () => {
    const { token } = await registerAndLogin();
    const headers = { authorization: `Bearer ${token}` };
    const targetLead = await createLeadViaHttp({
      companyName: "Acme Analytics",
      fullName: "Ada Lovelace",
    });
    const otherLead = await createLeadViaHttp({
      companyName: "Globex",
      fullName: "Alan Turing",
    });
    const target = await createDealViaHttp({
      leadId: targetLead.json<{ id: string }>().id,
    });
    await createDealViaHttp({ leadId: otherLead.json<{ id: string }>().id });

    const targetId = target.json<{ id: string }>().id;
    const responses = await Promise.all(
      ["lovel", "acme"].map((name) =>
        app.inject({
          headers,
          method: "GET",
          query: { name },
          url: DealRoutes.GET.SEARCH,
        })
      )
    );

    for (const response of responses) {
      expect(response.statusCode).toBe(HttpStatus.OK);
      const deals = dealDTOSchema.array().parse(response.json());
      expect(deals.map((deal) => deal.id)).toEqual([targetId]);
    }
  });
});
