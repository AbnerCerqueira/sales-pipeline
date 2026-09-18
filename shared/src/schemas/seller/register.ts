import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
