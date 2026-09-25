import { z } from "zod";

export const MAX_DEAL_VALUE = 9_999_999_999.99;

export const dealFields = {
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
  title: z.string().min(1, "Título é obrigatório").max(150),
  value: z
    .number("Valor deve ser um número")
    .positive("Valor deve ser positivo")
    .max(MAX_DEAL_VALUE, "Valor excede o limite suportado")
    .multipleOf(0.01, "Valor deve ter no máximo 2 casas decimais")
    .nullable()
    .optional(),
};
