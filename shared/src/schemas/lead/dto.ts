import { z } from "zod";
import { sellerSummarySchema } from "../seller/seller.ts";
import { leadSourceSchema } from "./lead.ts";

export const leadDTOSchema = z.object({
  companyName: z.string(),
  createdAt: z.iso.datetime(),
  description: z.string().nullable(),
  email: z.email(),
  fullName: z.string(),
  id: z.string(),
  responsible: sellerSummarySchema,
  source: leadSourceSchema,
  updatedAt: z.iso.datetime(),
  whatsapp: z.string(),
});

export type LeadDTO = z.infer<typeof leadDTOSchema>;

export const leadSummarySchema = leadDTOSchema.omit({
  createdAt: true,
  description: true,
  responsible: true,
  source: true,
  updatedAt: true,
});

export type LeadSummary = z.infer<typeof leadSummarySchema>;
