import { z } from "zod";
import { sellerSummarySchema } from "../seller/seller.ts";

export const commentDTOSchema = z.object({
  content: z.string(),
  createdAt: z.iso.datetime(),
  dealId: z.string(),
  id: z.string(),
  seller: sellerSummarySchema,
});

export type CommentDTO = z.infer<typeof commentDTOSchema>;

export const listCommentsResponseSchema = z.array(commentDTOSchema);

export type ListCommentsResponse = z.infer<typeof listCommentsResponseSchema>;
