import { dealDTOSchema } from "@sales/shared";
import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { createDealViaHttp } from "./helpers.ts";
import { DealRoutes } from "./routes.ts";

async function listDealIds(token: string) {
  const response = await app.inject({
    headers: { authorization: `Bearer ${token}` },
    method: "GET",
    url: DealRoutes.GET.SEARCH,
  });

  return dealDTOSchema
    .array()
    .parse(response.json())
    .map((deal) => deal.id);
}

function move(
  token: string,
  dealId: string,
  body: { afterDealId: string | null; status: string }
) {
  return app.inject({
    headers: { authorization: `Bearer ${token}` },
    method: "PUT",
    payload: body,
    url: DealRoutes.PUT.MOVE(dealId),
  });
}

/** Cria três negócios: o mais novo entra no topo, então a ordem é [third, second, first]. */
async function createThreeDeals() {
  const first = (await createDealViaHttp({})).json<{ id: string }>();
  const second = (await createDealViaHttp({})).json<{ id: string }>();
  const third = (await createDealViaHttp({})).json<{ id: string }>();
  return { first, second, third };
}

describe("PUT /deal/:id/position", () => {
  test("lists new deals on top of the board", async () => {
    const { token } = await registerAndLogin();
    const { first, second, third } = await createThreeDeals();

    expect(await listDealIds(token)).toEqual([third.id, second.id, first.id]);
  });

  test("moves a deal to the top of the board", async () => {
    const { token } = await registerAndLogin();
    const { first, second, third } = await createThreeDeals();

    const response = await move(token, first.id, {
      afterDealId: null,
      status: "open",
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(await listDealIds(token)).toEqual([first.id, third.id, second.id]);
  });

  test("moves a deal right after the given anchor", async () => {
    const { token } = await registerAndLogin();
    const { first, second, third } = await createThreeDeals();

    const response = await move(token, first.id, {
      afterDealId: third.id,
      status: "open",
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(await listDealIds(token)).toEqual([third.id, first.id, second.id]);
  });

  test("moves a deal to the end of the board", async () => {
    const { token } = await registerAndLogin();
    const { first, second, third } = await createThreeDeals();

    const response = await move(token, third.id, {
      afterDealId: first.id,
      status: "open",
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(await listDealIds(token)).toEqual([second.id, first.id, third.id]);
  });

  test("changes the column without moving the card in the global ranking", async () => {
    const { token } = await registerAndLogin();
    const open = (await createDealViaHttp({})).json<{ id: string }>();
    const anchor = (await createDealViaHttp({})).json<{ id: string }>();
    const ordered = await listDealIds(token);
    expect(ordered).toEqual([anchor.id, open.id]);

    const response = await move(token, open.id, {
      afterDealId: anchor.id,
      status: "negotiating",
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(dealDTOSchema.parse(response.json()).status).toBe("negotiating");
    // O ranking é global: o card muda de coluna sem sair do lugar na lista.
    expect(await listDealIds(token)).toEqual(ordered);
  });

  test("keeps the manual order after a field update", async () => {
    const { token } = await registerAndLogin();
    const { first, second, third } = await createThreeDeals();

    await move(token, first.id, { afterDealId: third.id, status: "open" });
    const ordered = await listDealIds(token);
    expect(ordered).toEqual([third.id, first.id, second.id]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "PATCH",
      payload: { title: "Renamed deal" },
      url: DealRoutes.PATCH.UPDATE(first.id),
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(await listDealIds(token)).toEqual(ordered);
  });

  test("returns 404 for a missing deal", async () => {
    const { token } = await registerAndLogin();
    const response = await move(token, crypto.randomUUID(), {
      afterDealId: null,
      status: "open",
    });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  test("returns 400 for an invalid payload", async () => {
    const { token } = await registerAndLogin();
    const deal = (await createDealViaHttp({})).json<{ id: string }>();
    const response = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "PUT",
      payload: { afterDealId: deal.id, status: "archived" },
      url: DealRoutes.PUT.MOVE(deal.id),
    });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });
});
