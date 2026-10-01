import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comentário é obrigatório")
    .max(2000, "Comentário excede o limite de 2000 caracteres"),
  dealId: z.uuid("Deal inválido"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
