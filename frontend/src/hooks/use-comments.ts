import type { CommentDTO, CreateCommentInput } from "@sales/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/toast.tsx";
import { api, SessionExpiredError } from "../lib/api.ts";

// Mesmo ritmo dos deals: comentário de outro vendedor aparece sem precisar refocar a aba.
const COMMENTS_REFETCH_INTERVAL_MS = 10_000;

export function useCommentsQuery(dealId: string) {
  return useQuery({
    queryFn: () => api.get<CommentDTO[]>(`/comment/deal/${dealId}`),
    queryKey: ["comments", dealId],
    refetchInterval: COMMENTS_REFETCH_INTERVAL_MS,
  });
}

export function useCreateCommentMutation(dealId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCommentInput) =>
      api.post<CommentDTO>("/comment", data),
    onError: (error) => {
      if (!(error instanceof SessionExpiredError)) {
        toast(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", dealId] });
    },
  });
}
