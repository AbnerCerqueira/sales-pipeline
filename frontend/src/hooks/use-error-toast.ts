import { useEffect } from "react";
import { useToast } from "../components/toast.tsx";
import { SessionExpiredError } from "../lib/api.ts";

interface ErrorState {
  error: Error | null;
  isError: boolean;
}

export function useErrorToast(source: ErrorState) {
  const { toast } = useToast();

  useEffect(() => {
    if (
      source.isError &&
      source.error &&
      !(source.error instanceof SessionExpiredError)
    ) {
      toast(source.error.message);
    }
  }, [source.isError, source.error, toast]);
}
