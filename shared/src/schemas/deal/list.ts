import { z } from "zod";
import { dealStatusSchema } from "./deal.ts";
import { dealDTOSchema } from "./dto.ts";

export const listDealsQuerySchema = z.object({
  leadId: z.uuid("Lead inválida").optional(),
  name: z.string().trim().min(1).max(150).optional(),
  responsibleId: z.uuid("Seller responsável inválido").optional(),
  status: dealStatusSchema.optional(),
  title: z.string().trim().min(1).max(150).optional(),
});

export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>;

export const listDealsResponseSchema = z.array(dealDTOSchema);

export type ListDealsResponse = z.infer<typeof listDealsResponseSchema>;
