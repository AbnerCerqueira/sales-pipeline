import { z } from "zod";

export const commentDealParamsSchema = z.object({
  dealId: z.uuid("Deal inválido"),
});

export type CommentDealParams = z.infer<typeof commentDealParamsSchema>;
