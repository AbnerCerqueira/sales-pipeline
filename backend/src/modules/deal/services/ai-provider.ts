import { ApplicationError } from "../../../utils/errors.ts";
import { HttpStatus } from "../../../utils/http-status.ts";

export class AiUnavailableError extends ApplicationError {
  constructor(
    message = "IA indisponível no momento. Tente novamente em alguns segundos.",
    options?: ErrorOptions
  ) {
    super(HttpStatus.SERVICE_UNAVAILABLE, message, options);
    this.name = "AiUnavailableError";
  }
}

export type SummarizeDealInput = {
  comments: string[];
  description: string | null;
  expectedCloseDate: string | null;
  leadName: string;
  status: string;
  title: string;
  value: number | null;
};

export interface AiProvider {
  summarizeDeal: (input: SummarizeDealInput) => Promise<string>;
}
