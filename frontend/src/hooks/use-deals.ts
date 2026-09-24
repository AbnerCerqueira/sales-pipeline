import type { CreateDealInput, DealDTO } from "@sales/shared";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function useCreateDealMutation() {
  return useMutation({
    mutationFn: (data: CreateDealInput) => api.post<DealDTO>("/deal", data),
  });
}
