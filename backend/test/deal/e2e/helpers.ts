import { randomUUID } from "node:crypto";
import type { CreateDealInput } from "@sales/shared";
import { app } from "../../../src/app.ts";
import { createLeadViaHttp } from "../../lead/e2e/helpers.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { DealRoutes } from "./routes.ts";

let requesterToken: string | null = null;

async function authHeaders(): Promise<Record<string, string>> {
  requesterToken ??= (await registerAndLogin()).token;
  return { authorization: `Bearer ${requesterToken}` };
}

export async function createDealPayload(
  overrides: Partial<CreateDealInput> = {}
): Promise<CreateDealInput> {
  const suffix = randomUUID().slice(0, 8);
  const { leadId: overrideLeadId, ...rest } = overrides;

  let leadId = overrideLeadId;
  if (!leadId) {
    const leadResponse = await createLeadViaHttp();
    leadId = leadResponse.json<{ id: string }>().id;
  }

  return {
    description: null,
    expectedCloseDate: null,
    status: "open",
    title: `Deal ${suffix}`,
    value: 1500.5,
    ...rest,
    leadId,
  };
}

export async function createDealViaHttp(
  overrides: Partial<CreateDealInput> = {}
) {
  const payload = await createDealPayload(overrides);

  return app.inject({
    headers: await authHeaders(),
    method: "POST",
    payload,
    url: DealRoutes.POST.CREATE,
  });
}
