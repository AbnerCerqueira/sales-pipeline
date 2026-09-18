import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("E-mail inválido").max(255),
  name: z.string().min(1, "Nome é obrigatório").max(100),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
