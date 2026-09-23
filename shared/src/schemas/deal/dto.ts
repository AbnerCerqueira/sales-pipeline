import { z } from "zod";
import { leadSummarySchema } from "../lead/dto.ts";
import { sellerSummarySchema } from "../seller/seller.ts";
import { dealStatusSchema } from "./deal.ts";

export const dealDTOSchema = z.object({
  createdAt: z.coerce.date(),
  description: z.string().nullable(),
  expectedCloseDate: z.string().nullable(),
  id: z.string(),
  lead: leadSummarySchema,
  responsible: sellerSummarySchema,
  status: dealStatusSchema,
  title: z.string(),
  updatedAt: z.coerce.date(),
  value: z.number().nullable(),
});

export type DealDTO = z.infer<typeof dealDTOSchema>;
