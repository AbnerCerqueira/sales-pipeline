import { z } from "zod";

export const dealStatusSchema = z.enum(["open", "negotiating", "won", "lost"]);

export type DealStatus = z.infer<typeof dealStatusSchema>;
