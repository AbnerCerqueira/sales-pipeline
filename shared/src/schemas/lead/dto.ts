import { z } from "zod";
import { leadSourceSchema } from "./lead.ts";

export const leadResponsibleSchema = z.object({
  email: z.email(),
  id: z.string(),
  name: z.string(),
});

export type LeadResponsible = z.infer<typeof leadResponsibleSchema>;

export const leadDTOSchema = z.object({
  companyName: z.string(),
  createdAt: z.coerce.date(),
  description: z.string(),
  email: z.email(),
  fullName: z.string(),
  id: z.string(),
  location: z.string(),
  responsible: leadResponsibleSchema,
  responsibleId: z.string(),
  source: leadSourceSchema,
  updatedAt: z.coerce.date(),
  whatsapp: z.string(),
});

export type LeadDTO = z.infer<typeof leadDTOSchema>;
