import type {
  CreateLeadInput,
  LeadDTO,
  SearchLeadsResponse,
} from "@sales/shared";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export interface LeadsFilters {
  name?: string;
  page: number;
  pageSize: number;
  responsibleId?: string;
}

export function useLeadsQuery(filters: LeadsFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });

  if (filters.name) {
    params.set("name", filters.name);
  }

  if (filters.responsibleId) {
    params.set("responsibleId", filters.responsibleId);
  }

  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => api.get<SearchLeadsResponse>(`/lead/search?${params}`),
    queryKey: ["leads", filters],
  });
}

export function useCreateLeadMutation() {
  return useMutation({
    mutationFn: (data: CreateLeadInput) => api.post<LeadDTO>("/lead", data),
  });
}
