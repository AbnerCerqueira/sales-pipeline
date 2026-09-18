import type { CreateLeadInput, LeadDTO } from "@sales/shared";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function useCreateLeadMutation() {
  return useMutation({
    mutationFn: (data: CreateLeadInput) => api.post<LeadDTO>("/lead", data),
  });
}
