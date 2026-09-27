import { dealStatusSchema, MAX_DEAL_VALUE } from "@sales/shared";
import { z } from "zod";
import { parseCurrency } from "./masks.ts";

const expectedCloseDateField = z.iso
  .date("Data de fechamento inválida")
  .or(z.literal(""));

const responsibleField = z
  .uuid("Seller responsável inválido")
  .or(z.literal(""));

const commonFields = {
  description: z.string().trim().max(1000).nullable().optional(),
  expectedCloseDate: expectedCloseDateField.optional(),
  status: dealStatusSchema,
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(150, "Título deve ter no máximo 150 caracteres"),
  value: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }
      const parsed = parseCurrency(value);
      return parsed !== null && parsed > 0 && parsed <= MAX_DEAL_VALUE;
    }, "Valor deve ser um número positivo com no máximo 2 casas decimais"),
};

export const createDealFormSchema = z.object({
  ...commonFields,
  leadId: z.uuid("Selecione uma lead"),
  responsibleId: responsibleField.optional(),
});

export type CreateDealFormInput = z.infer<typeof createDealFormSchema>;

export const updateDealFormSchema = z.object({
  ...commonFields,
  responsibleId: responsibleField,
});

export type UpdateDealFormInput = z.infer<typeof updateDealFormSchema>;
