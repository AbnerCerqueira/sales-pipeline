import { z } from "zod";
import { leadSourceSchema } from "./lead.ts";

export const createLeadSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório").max(100),
  description: z
    .string()
    .max(1000)
    .nullable()
    .transform((value) => value?.trim() || null),
  email: z.email("E-mail inválido").max(255),
  fullName: z.string().min(1, "Nome é obrigatório").max(100),
  responsibleId: z.uuid("Seller responsável inválido"),
  source: leadSourceSchema,
  whatsapp: z
    .string()
    .min(1, "WhatsApp é obrigatório")
    .max(20)
    .regex(
      /^\(\d{2}\) \d{5}-\d{4}$/,
      "WhatsApp deve estar no formato (11) 99999-8888"
    ),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
