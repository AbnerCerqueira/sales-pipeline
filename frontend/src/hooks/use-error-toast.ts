import { useEffect } from "react";
import { useToast } from "../components/toast.tsx";

interface ErrorState {
  error: Error | null;
  isError: boolean;
}

export function useErrorToast(source: ErrorState) {
  const { toast } = useToast();

  useEffect(() => {
    if (source.isError && source.error) {
      toast(source.error.message);
    }
  }, [source.isError, source.error, toast]);
}
