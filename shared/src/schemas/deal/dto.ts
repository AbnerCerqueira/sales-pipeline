import { z } from "zod";
import { dealStatusSchema } from "./deal.ts";

export const dealResponsibleSchema = z.object({
  email: z.email(),
  id: z.string(),
  name: z.string(),
});

export type DealResponsible = z.infer<typeof dealResponsibleSchema>;

export const dealDTOSchema = z.object({
  createdAt: z.coerce.date(),
  description: z.string().nullable(),
  expectedCloseDate: z.string().nullable(),
  id: z.string(),
  leadId: z.string(),
  responsible: dealResponsibleSchema,
  responsibleId: z.string(),
  status: dealStatusSchema,
  title: z.string(),
  updatedAt: z.coerce.date(),
  value: z.number().nullable(),
});

export type DealDTO = z.infer<typeof dealDTOSchema>;
