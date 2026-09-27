import type {
  CreateDealInput,
  DealDTO,
  DealStatus,
  ListDealsQuery,
  UpdateDealInput,
} from "@sales/shared";
import {
  keepPreviousData,
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

  if (filters.leadId) {
    params.set("leadId", filters.leadId);
  }

  if (filters.name) {
    params.set("name", filters.name);
  }

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
    placeholderData: keepPreviousData,
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

export type MoveDealInput = {
  /** Card de destino: o negócio entra logo depois dele. `null` manda para o topo. */
  afterDealId: string | null;
  status: DealStatus;
};

/**
 * Mesma reordenação do backend (`reorderDealIds`). O board usa isto no render,
 * antes do `onMutate` rodar: o `onMutate` do React Query é async, então sem o
 * espelho no render o board voltaria à disposição antiga por 1 commit no drop —
 * e o `dropAnimation` do overlay pousaria no slot errado.
 */
export function applyOptimisticMove(
  deals: DealDTO[],
  dealId: string,
  input: MoveDealInput
): DealDTO[] {
  const moved = deals.find((deal) => deal.id === dealId);
  if (!moved) {
    return deals;
  }

  const rest = deals.filter((deal) => deal.id !== dealId);
  const anchorIndex = input.afterDealId
    ? rest.findIndex((deal) => deal.id === input.afterDealId)
    : -1;
  const insertAt = anchorIndex === -1 ? 0 : anchorIndex + 1;

  return [
    ...rest.slice(0, insertAt),
    { ...moved, status: input.status },
    ...rest.slice(insertAt),
  ];
}

export function useMoveDealMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  type MoveContext = {
    previousBoards: [readonly unknown[], DealDTO[] | undefined][];
  };

  const mutation: UseMutationResult<
    DealDTO,
    Error,
    { dealId: string; input: MoveDealInput },
    MoveContext
  > = useMutation({
    mutationFn: ({ dealId, input }: { dealId: string; input: MoveDealInput }) =>
      api.put<DealDTO>(`/deal/${dealId}/position`, input),
    onError: (error, _variables, context) => {
      for (const [queryKey, deals] of context?.previousBoards ?? []) {
        queryClient.setQueryData(queryKey, deals);
      }

      if (!(error instanceof SessionExpiredError)) {
        toast(error.message);
      }
    },
    onMutate: async ({ dealId, input }) => {
      await queryClient.cancelQueries({ queryKey: ["deals"] });

      const previousBoards = queryClient.getQueriesData<DealDTO[]>({
        queryKey: ["deals"],
      });

      queryClient.setQueriesData<DealDTO[]>({ queryKey: ["deals"] }, (old) =>
        old ? applyOptimisticMove(old, dealId, input) : old
      );

      return { previousBoards };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  return mutation;
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

// O form manda "YYYY-MM-DD" e o DTO guarda instante ISO: o estado otimista
// precisa sair no mesmo formato que o servidor devolveria.
function optimisticCloseDate(
  value: string | null | undefined,
  current: string | null
): string | null {
  if (value === undefined) {
    return current;
  }
  return value === null ? null : new Date(value).toISOString();
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
    expectedCloseDate: optimisticCloseDate(
      data.expectedCloseDate,
      deal.expectedCloseDate
    ),
    status: data.status === undefined ? deal.status : data.status,
    title: data.title === undefined ? deal.title : data.title,
    value: data.value === undefined ? deal.value : data.value,
  };
}
