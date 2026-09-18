import { z } from "zod";

export function paginatedResultSchema<T extends z.ZodType>(items: T) {
  return z.object({
    items: z.array(items),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
