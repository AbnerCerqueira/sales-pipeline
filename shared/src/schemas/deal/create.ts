import { z } from "zod";
import { dealStatusSchema } from "./deal.ts";
import { dealFields } from "./fields.ts";

export const createDealSchema = z.object({
  ...dealFields,
  leadId: z.uuid("Lead inválida"),
  responsibleId: z.uuid("Seller responsável inválido").optional(),
  status: dealStatusSchema.default("open"),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
