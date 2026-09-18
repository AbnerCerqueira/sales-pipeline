import { z } from "zod";
import { type PaginatedResult, paginatedResultSchema } from "../pagination.ts";
import { type LeadDTO, leadDTOSchema } from "./dto.ts";

export const searchLeadsQuerySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  responsibleId: z.uuid("Seller responsável inválido").optional(),
});

export type SearchLeadsQuery = z.infer<typeof searchLeadsQuerySchema>;

export const searchLeadsResponseSchema = paginatedResultSchema(leadDTOSchema);

export type SearchLeadsResponse = PaginatedResult<LeadDTO>;
