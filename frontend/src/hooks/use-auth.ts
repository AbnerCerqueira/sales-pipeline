import type {
  LoginInput,
  LoginResponse,
  RegisterInput,
  SellerDTO,
} from "@sales/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (data: LoginInput) =>
      api.post<LoginResponse>("/seller/login", data),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: RegisterInput) =>
      api.post<SellerDTO>("/seller/register", data),
  });
}

export function useMeQuery() {
  return useQuery({
    queryFn: () => api.get<SellerDTO>("/seller/me"),
    queryKey: ["me"],
  });
}
