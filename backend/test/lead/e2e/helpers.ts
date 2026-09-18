import { randomUUID } from "node:crypto";
import type { LeadSource } from "@sales/shared";
import { app } from "../../../src/app.ts";
import { createSellerViaHttp } from "../../seller/e2e/helpers.ts";
import { LeadRoutes } from "./routes.ts";

export type LeadPayload = {
  companyName: string;
  description: string;
  email: string;
  fullName: string;
  location: string;
  responsibleId: string;
  source: LeadSource;
  whatsapp: string;
};

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
    location: "São Paulo, SP",
    responsibleId: seller.id,
    source: "inbound",
    whatsapp: "+5511999990000",
    ...overrides,
  };
}

export function createLeadViaHttp(overrides?: Partial<LeadPayload>) {
  return createLeadPayload(overrides).then((payload) =>
    app.inject({
      method: "POST",
      payload,
      url: LeadRoutes.POST.CREATE,
    })
  );
}
