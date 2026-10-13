import { z } from "zod";

export const dealSummaryResponseSchema = z.object({
  summary: z.string(),
});

export type DealSummaryResponse = z.infer<typeof dealSummaryResponseSchema>;
