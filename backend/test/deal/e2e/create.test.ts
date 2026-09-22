import { randomUUID } from "node:crypto";
import { dealDTOSchema } from "@sales/shared";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createLeadViaHttp } from "../../lead/e2e/helpers.ts";
import { createSellerViaHttp } from "../../seller/e2e/helpers.ts";
import { createDealPayload, createDealViaHttp } from "./helpers.ts";
import { DealRoutes } from "./routes.ts";

describe("Create Deal", () => {
  test("creates deal with default responsible from lead", async () => {
    const leadResponse = await createLeadViaHttp();
    const lead = leadResponse.json<{ id: string; responsibleId: string }>();

    const response = await createDealViaHttp({
      leadId: lead.id,
      title: "Renovação anual",
      value: 1234.56,
    });

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const deal = dealDTOSchema.parse(response.json());

    expect(deal.id).toBeDefined();
    expect(deal.leadId).toBe(lead.id);
    expect(deal.responsibleId).toBe(lead.responsibleId);
    expect(deal.responsible.id).toBe(lead.responsibleId);
    expect(deal.title).toBe("Renovação anual");
    expect(deal.value).toBe(1234.56);
    expect(deal.status).toBe("open");
    expect(deal.description).toBe(null);
    expect(deal.expectedCloseDate).toBe(null);
    expect(deal.createdAt).toBeInstanceOf(Date);
  });

  test("creates deal with responsible override", async () => {
    const otherSeller = await createSellerViaHttp();

    const response = await createDealViaHttp({
      responsibleId: otherSeller.id,
      title: "Deal transferido",
    });

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const deal = dealDTOSchema.parse(response.json());

    expect(deal.responsibleId).toBe(otherSeller.id);
    expect(deal.responsible.id).toBe(otherSeller.id);
  });

  test("creates deal with optional fields", async () => {
    const response = await createDealViaHttp({
      description: "  Negociação em andamento  ",
      expectedCloseDate: "2026-10-15",
      title: "Deal completo",
      value: 99.9,
    });

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const deal = dealDTOSchema.parse(response.json());

    expect(deal.description).toBe("Negociação em andamento");
    expect(deal.expectedCloseDate).toBe("2026-10-15");
    expect(deal.value).toBe(99.9);
  });

  test("creates deal with null value", async () => {
    const response = await createDealViaHttp({ value: null });

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(dealDTOSchema.parse(response.json()).value).toBe(null);
  });

  test("normalizes empty description to null", async () => {
    const response = await createDealViaHttp({ description: "   " });

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(dealDTOSchema.parse(response.json()).description).toBe(null);
  });

  test("allows multiple deals for the same lead", async () => {
    const leadResponse = await createLeadViaHttp();
    const lead = leadResponse.json<{ id: string }>();

    const first = await createDealViaHttp({ leadId: lead.id });
    const second = await createDealViaHttp({ leadId: lead.id });

    expect(first.statusCode).toBe(HttpStatus.CREATED);
    expect(second.statusCode).toBe(HttpStatus.CREATED);
    expect(dealDTOSchema.parse(first.json()).id).not.toBe(
      dealDTOSchema.parse(second.json()).id
    );
  });

  test("returns 400 when value has more than 2 decimal places", async () => {
    const response = await createDealViaHttp({ value: 10.999 });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  test("returns 404 when lead does not exist", async () => {
    const response = await createDealViaHttp({ leadId: randomUUID() });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  test("returns 404 when responsible override does not exist", async () => {
    const response = await createDealViaHttp({
      responsibleId: randomUUID(),
    });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  test("returns 401 when token is missing", async () => {
    const payload = await createDealPayload();

    const response = await app.inject({
      method: "POST",
      payload,
      url: DealRoutes.POST.CREATE,
    });

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });
});
