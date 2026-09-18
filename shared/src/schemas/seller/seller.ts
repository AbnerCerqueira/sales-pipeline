import { z } from "zod";

export const sellerDTOSchema = z.object({
  createdAt: z.coerce.date(),
  email: z.email(),
  id: z.string(),
  name: z.string(),
  updatedAt: z.coerce.date(),
});

export type SellerDTO = z.infer<typeof sellerDTOSchema>;
