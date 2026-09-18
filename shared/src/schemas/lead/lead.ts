import { z } from "zod";

export const leadSourceSchema = z.enum([
  "referral",
  "inbound",
  "outbound",
  "other",
]);

export type LeadSource = z.infer<typeof leadSourceSchema>;
