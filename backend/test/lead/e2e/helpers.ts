import { randomUUID } from "node:crypto";
import type { LeadSource, SearchLeadsQuery } from "@sales/shared";
import { app } from "../../../src/app.ts";
import {
  createSellerViaHttp,
  registerAndLogin,
} from "../../seller/e2e/helpers.ts";
import { LeadRoutes } from "./routes.ts";

export type LeadPayload = {
  companyName: string;
  description: string | null;
  email: string;
  fullName: string;
  responsibleId: string;
  source: LeadSource;
  whatsapp: string;
};

let requesterToken: string | null = null;

async function authHeaders(): Promise<Record<string, string>> {
  requesterToken ??= (await registerAndLogin()).token;
  return { authorization: `Bearer ${requesterToken}` };
}

export async function createLeadPayload(
  overrides?: Partial<LeadPayload>
): Promise<LeadPayload> {
  const suffix = randomUUID().slice(0, 8);
  const seller = await createSellerViaHttp();

  return {
    companyName: `Company ${suffix}`,
    description: "Potential client",
    email: `lead+${suffix}@example.com`,
    fullName: `Lead ${suffix}`,
    responsibleId: seller.id,
    source: "inbound",
    whatsapp: "(11) 99999-0000",
    ...overrides,
  };
}

export async function createLeadViaHttp(overrides?: Partial<LeadPayload>) {
  const payload = await createLeadPayload(overrides);

  return app.inject({
    headers: await authHeaders(),
    method: "POST",
    payload,
    url: LeadRoutes.POST.CREATE,
  });
}

export async function searchLeadsViaHttp(query?: Partial<SearchLeadsQuery>) {
  return app.inject({
    headers: await authHeaders(),
    method: "GET",
    query: Object.fromEntries(
      Object.entries(query ?? {}).map(([key, value]) => [key, String(value)])
    ),
    url: LeadRoutes.GET.SEARCH,
  });
}
