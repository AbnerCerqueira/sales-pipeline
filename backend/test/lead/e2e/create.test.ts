import { randomUUID } from "node:crypto";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createLeadPayload, createLeadViaHttp } from "./helpers.ts";

describe("Create Lead", () => {
  test("creates lead and returns 201 with lead data", async () => {
    const payload = await createLeadPayload();

    const response = await createLeadViaHttp(payload);

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const lead = response.json<{
      companyName: string;
      email: string;
      fullName: string;
      id: string;
      responsible: { email: string; id: string; name: string };
      responsibleId: string;
      source: string;
    }>();

    expect(lead.id).toBeDefined();
    expect(lead.fullName).toBe(payload.fullName);
    expect(lead.companyName).toBe(payload.companyName);
    expect(lead.email).toBe(payload.email);
    expect(lead.responsibleId).toBe(payload.responsibleId);
    expect(lead.source).toBe(payload.source);
    expect(lead.responsible).toEqual({
      email: expect.any(String),
      id: payload.responsibleId,
      name: expect.any(String),
    });
  });

  test("creates lead with null description", async () => {
    const payload = await createLeadPayload({ description: null });

    const response = await createLeadViaHttp(payload);

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.json<{ description: string | null }>().description).toBe(
      null
    );
  });

  test("normalizes empty description to null", async () => {
    const payload = await createLeadPayload({ description: "   " });

    const response = await createLeadViaHttp(payload);

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.json<{ description: string | null }>().description).toBe(
      null
    );
  });

  test("returns 404 when responsible seller does not exist", async () => {
    const response = await createLeadViaHttp({
      responsibleId: randomUUID(),
    });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  test("returns 409 when lead email is already taken", async () => {
    const payload = await createLeadPayload();
    await createLeadViaHttp(payload);

    const response = await createLeadViaHttp({
      ...payload,
      fullName: "Another Lead",
    });

    expect(response.statusCode).toBe(HttpStatus.CONFLICT);
  });
});
