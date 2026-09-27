import { z } from "zod";
import { dealStatusSchema } from "./deal.ts";

/**
 * Reposiciona um negócio no board. `afterDealId` é o card vizinho de destino:
 * `null` manda para o topo. É uma âncora, não um índice, para a ordem não
 * depender dos filtros que o vendedor aplicou no board.
 */
export const moveDealSchema = z.object({
  afterDealId: z.uuid("Deal de referência inválido").nullable(),
  status: dealStatusSchema,
});

export type MoveDealInput = z.infer<typeof moveDealSchema>;
