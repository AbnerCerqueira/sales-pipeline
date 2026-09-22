import { z } from "zod";

export const createDealSchema = z.object({
  description: z
    .string()
    .max(1000)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null),
  expectedCloseDate: z.iso
    .date("Data de fechamento inválida")
    .nullable()
    .optional(),
  leadId: z.uuid("Lead inválida"),
  responsibleId: z.uuid("Seller responsável inválido").optional(),
  title: z.string().min(1, "Título é obrigatório").max(150),
  value: z
    .number("Valor deve ser um número")
    .positive("Valor deve ser positivo")
    .max(9_999_999_999.99, "Valor excede o limite suportado")
    .multipleOf(0.01, "Valor deve ter no máximo 2 casas decimais")
    .nullable()
    .optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
