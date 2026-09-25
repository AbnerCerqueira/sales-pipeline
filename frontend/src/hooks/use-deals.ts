import type {
  CreateDealInput,
  DealDTO,
  ListDealsQuery,
  UpdateDealInput,
} from "@sales/shared";
import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "../components/toast.tsx";
import { api, SessionExpiredError } from "../lib/api.ts";

export type DealsFilters = ListDealsQuery;

function buildSearchPath(filters: DealsFilters): string {
  const params = new URLSearchParams();

  if (filters.responsibleId) {
    params.set("responsibleId", filters.responsibleId);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.title) {
    params.set("title", filters.title);
  }

  const queryString = params.toString();
  return queryString ? `/deal/search?${queryString}` : "/deal/search";
}

// Polling para refletir edições de outros vendedores sem SSE; `paused` evita que o refetch sobrescreva o patch otimista no meio de uma ação local.
const DEALS_REFETCH_INTERVAL_MS = 10_000;

export function useDealsQuery(filters: DealsFilters, paused = false) {
  return useQuery({
    queryFn: () => api.get<DealDTO[]>(buildSearchPath(filters)),
    queryKey: ["deals", filters],
    refetchInterval: () => (paused ? false : DEALS_REFETCH_INTERVAL_MS),
  });
}

export function useCreateDealMutation() {
  return useMutation({
    mutationFn: (data: CreateDealInput) => api.post<DealDTO>("/deal", data),
  });
}

export function useUpdateDealMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  type UpdateContext = {
    previousBoards: [readonly unknown[], DealDTO[] | undefined][];
  };

  const mutation: UseMutationResult<
    DealDTO,
    Error,
    { data: UpdateDealInput; id: string },
    UpdateContext
  > = useMutation({
    mutationFn: ({ data, id }: { data: UpdateDealInput; id: string }) =>
      api.patch<DealDTO>(`/deal/${id}`, data),
    onError: (error, _variables, context) => {
      for (const [queryKey, deals] of context?.previousBoards ?? []) {
        queryClient.setQueryData(queryKey, deals);
      }

      if (!(error instanceof SessionExpiredError)) {
        toast(error.message);
      }
    },
    onMutate: async ({ data, id }) => {
      await queryClient.cancelQueries({ queryKey: ["deals"] });

      const previousBoards = queryClient.getQueriesData<DealDTO[]>({
        queryKey: ["deals"],
      });

      queryClient.setQueriesData<DealDTO[]>({ queryKey: ["deals"] }, (old) =>
        old?.map((deal) =>
          deal.id === id ? applyOptimisticPatch(deal, data) : deal
        )
      );

      return { previousBoards };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
    onSuccess: (updated) => {
      queryClient.setQueriesData<DealDTO[]>({ queryKey: ["deals"] }, (old) =>
        old?.map((deal) => (deal.id === updated.id ? updated : deal))
      );
    },
  });

  return mutation;
}

// Merge campo a campo: `??` apagaria null preenchido de propósito (ex: description)
// e `responsibleId` não existe no DealDTO (só o resumo em `responsible`).
export function applyOptimisticPatch(
  deal: DealDTO,
  data: UpdateDealInput
): DealDTO {
  return {
    ...deal,
    description:
      data.description === undefined ? deal.description : data.description,
    expectedCloseDate:
      data.expectedCloseDate === undefined
        ? deal.expectedCloseDate
        : data.expectedCloseDate,
    status: data.status === undefined ? deal.status : data.status,
    title: data.title === undefined ? deal.title : data.title,
    value: data.value === undefined ? deal.value : data.value,
  };
}
