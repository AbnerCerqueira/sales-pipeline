import type { DealSummaryResponse } from "@sales/shared";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "../components/toast.tsx";
import { api, SessionExpiredError } from "../lib/api.ts";

export function useDealSummaryMutation(dealId: string) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () =>
      api.post<DealSummaryResponse>(`/deal/${dealId}/summary`, {}),
    mutationKey: ["deal-summary", dealId],
    onError: (error) => {
      if (!(error instanceof SessionExpiredError)) {
        toast(error.message);
      }
    },
    // Sem retry no front: cada tentativa custa tokens reais, e o backend
    // já faz retry com backoff nos erros transitórios.
    retry: false,
  });
}
