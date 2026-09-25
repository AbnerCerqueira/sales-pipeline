import { randomUUID } from "node:crypto";
import { dealDTOSchema } from "@sales/shared";
import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { createDealViaHttp } from "./helpers.ts";
import { DealRoutes } from "./routes.ts";

describe("PATCH /deal/:id", () => {
  test("updates status through the kanban flow", async () => {
    const response = await createDealViaHttp();
    const created = response.json<{ id: string }>();

    const { token } = await registerAndLogin();
    const updated = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "PATCH",
      payload: { status: "negotiating" },
      url: DealRoutes.PATCH.UPDATE(created.id),
    });

    expect(updated.statusCode).toBe(HttpStatus.OK);
    expect(dealDTOSchema.parse(updated.json()).status).toBe("negotiating");
  });

  test("allows any status change, including reopening a closed deal", async () => {
    const response = await createDealViaHttp();
    const created = response.json<{ id: string }>();

    const { token } = await registerAndLogin();
    const won = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "PATCH",
      payload: { status: "won" },
      url: DealRoutes.PATCH.UPDATE(created.id),
    });
    const reopened = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "PATCH",
      payload: { status: "negotiating" },
      url: DealRoutes.PATCH.UPDATE(created.id),
    });

    expect(won.statusCode).toBe(HttpStatus.OK);
    expect(dealDTOSchema.parse(won.json()).status).toBe("won");
    expect(reopened.statusCode).toBe(HttpStatus.OK);
    expect(dealDTOSchema.parse(reopened.json()).status).toBe("negotiating");
  });

  test("returns 404 for missing deal", async () => {
    const { token } = await registerAndLogin();
    const updated = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "PATCH",
      payload: { status: "negotiating" },
      url: DealRoutes.PATCH.UPDATE(randomUUID()),
    });

    expect(updated.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  test("updates value, description and expected close date", async () => {
    const response = await createDealViaHttp();
    const created = response.json<{ id: string }>();

    const { token } = await registerAndLogin();
    const updated = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "PATCH",
      payload: {
        description: "Proposta enviada com desconto de 10%",
        expectedCloseDate: "2026-10-15",
        value: 950.25,
      },
      url: DealRoutes.PATCH.UPDATE(created.id),
    });

    const deal = dealDTOSchema.parse(updated.json());
    expect(updated.statusCode).toBe(HttpStatus.OK);
    expect(deal.description).toBe("Proposta enviada com desconto de 10%");
    expect(deal.expectedCloseDate).toBe("2026-10-15");
    expect(deal.value).toBe(950.25);
  });
});
