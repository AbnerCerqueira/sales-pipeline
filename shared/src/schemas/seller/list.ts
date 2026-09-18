import { z } from "zod";
import { sellerDTOSchema } from "./seller.ts";

export const listSellersResponseSchema = z.array(sellerDTOSchema);
