import { z } from "zod";
import { leadSourceSchema } from "./lead.ts";

export const createLeadSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório").max(100),
  description: z.string().min(1, "Descrição é obrigatória").max(1000),
  email: z.email("E-mail inválido").max(255),
  fullName: z.string().min(1, "Nome é obrigatório").max(100),
  location: z.string().min(1, "Localização é obrigatória").max(100),
  responsibleId: z.uuid("Seller responsável inválido"),
  source: leadSourceSchema,
  whatsapp: z.string().min(1, "WhatsApp é obrigatório").max(20),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
