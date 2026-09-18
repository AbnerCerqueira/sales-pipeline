import { z } from "zod";
import { sellerDTOSchema } from "./seller.ts";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  seller: sellerDTOSchema,
  token: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
