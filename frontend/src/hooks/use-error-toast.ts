import { useEffect, useRef } from "react";
import { useToast } from "../components/toast.tsx";
import { SessionExpiredError } from "../lib/api.ts";

interface ErrorState {
  error: Error | null;
  isError: boolean;
  // Opcional: mutações não expõem isFetching.
  isFetching?: boolean;
}

export function useErrorToast(source: ErrorState) {
  const { toast } = useToast();
  // Polling gera um Error novo por tentativa; deduplica para não repetir o toast.
  const lastMessage = useRef<string | null>(null);

  useEffect(() => {
    if (!(source.isError && source.error)) {
      // Fetch em andamento limpa `error` temporariamente (query sem cache volta a
      // `pending`); só reseta quando estabiliza, senão cada tentativa reabriria o toast.
      if (!source.isFetching) {
        lastMessage.current = null;
      }
      return;
    }
    if (
      source.error instanceof SessionExpiredError ||
      lastMessage.current === source.error.message
    ) {
      return;
    }
    lastMessage.current = source.error.message;
    toast(source.error.message);
  }, [source.isError, source.error, source.isFetching, toast]);
}
