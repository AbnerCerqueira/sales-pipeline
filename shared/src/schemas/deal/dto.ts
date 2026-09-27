import { z } from "zod";
import { leadSummarySchema } from "../lead/dto.ts";
import { sellerSummarySchema } from "../seller/seller.ts";
import { dealStatusSchema } from "./deal.ts";

export const dealDTOSchema = z.object({
  createdAt: z.iso.datetime(),
  description: z.string().nullable(),
  expectedCloseDate: z.iso.datetime().nullable(),
  id: z.string(),
  lead: leadSummarySchema,
  responsible: sellerSummarySchema,
  status: dealStatusSchema,
  title: z.string(),
  updatedAt: z.iso.datetime(),
  value: z.number().nullable(),
});

export type DealDTO = z.infer<typeof dealDTOSchema>;
