import type { SellerDTO } from "@sales/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function useSellersQuery() {
  return useQuery({
    queryFn: () => api.get<SellerDTO[]>("/seller"),
    queryKey: ["sellers"],
  });
}
