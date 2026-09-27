import { z } from "zod";

export const sellerDTOSchema = z.object({
  createdAt: z.iso.datetime(),
  email: z.email(),
  id: z.string(),
  name: z.string(),
  updatedAt: z.iso.datetime(),
});

export type SellerDTO = z.infer<typeof sellerDTOSchema>;

export const sellerSummarySchema = sellerDTOSchema.pick({
  email: true,
  id: true,
  name: true,
});

export type SellerSummary = z.infer<typeof sellerSummarySchema>;
