import { z } from "zod";
import { dealStatusSchema } from "./deal.ts";
import { dealFields } from "./fields.ts";

export const updateDealSchema = z
  .object({
    ...dealFields,
    responsibleId: z.uuid("Seller responsável inválido"),
    status: dealStatusSchema,
  })
  .partial();

export type UpdateDealInput = z.infer<typeof updateDealSchema>;

export const dealIdParamsSchema = z.object({
  id: z.uuid("Deal inválido"),
});
