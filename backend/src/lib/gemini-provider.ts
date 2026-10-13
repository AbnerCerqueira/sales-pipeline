import {
  type ApiError,
  type GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import {
  type AiProvider,
  AiUnavailableError,
  type SummarizeDealInput,
} from "../modules/deal/services/ai-provider.ts";
import { logger } from "../utils/logger.ts";
import { tryCatch } from "../utils/try-catch.ts";

export type GeminiConfig = {
  apiKey: string;
  model: string;
};

const SYSTEM_INSTRUCTION =
  "Você é um assistente de vendas. Resuma o negócio em até 5 linhas " +
  "com: situação atual, último avanço, principal trava e sugestão de próximo passo. " +
  "Tom direto, em português, sem enrolação. " +
  // O front renderiza bullets `- ` com rótulos em `**negrito**`: o formato
  // precisa vir daqui, não do acaso do modelo.
  "Responda em bullets `- ` com os rótulos em `**negrito**`.";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(cause: unknown): boolean {
  if (typeof cause !== "object" || cause === null || !("status" in cause)) {
    return true;
  }
  const status: unknown = cause.status;
  return typeof status !== "number" || TRANSIENT_STATUS.has(status);
}

function buildPrompt(input: SummarizeDealInput): string {
  const comments =
    input.comments.length > 0
      ? input.comments.map((c) => `- ${c}`).join("\n")
      : "(sem comentários)";

  return [
    `Negócio: ${input.title}`,
    `Lead: ${input.leadName}`,
    `Status: ${input.status}`,
    `Valor: ${input.value ?? "(não informado)"}`,
    `Previsão de fechamento: ${input.expectedCloseDate ?? "(sem previsão)"}`,
    `Descrição: ${input.description ?? "(sem descrição)"}`,
    "",
    "Comentários:",
    comments,
  ].join("\n");
}

export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(config: GeminiConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  summarizeDeal(input: SummarizeDealInput): Promise<string> {
    return this.requestWithRetry(input, 1, Date.now());
  }

  private async requestWithRetry(
    input: SummarizeDealInput,
    attempt: number,
    startedAt: number
  ): Promise<string> {
    const result = await tryCatch<GenerateContentResponse, ApiError>(
      this.client.models.generateContent({
        config: {
          maxOutputTokens: 400,
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.4,
        },
        contents: buildPrompt(input),
        model: this.model,
      })
    );

    if (!result.ok) {
      if (attempt >= MAX_ATTEMPTS || !isTransientError(result.error)) {
        logger.warn({ cause: result.error }, "Gemini request failed");
        throw new AiUnavailableError(undefined, { cause: result.error });
      }
      logger.warn({ attempt, model: this.model }, "Gemini retrying");
      await delay(BASE_DELAY_MS * 2 ** (attempt - 1));
      return this.requestWithRetry(input, attempt + 1, startedAt);
    }

    const summary = result.data.text?.trim();
    if (!summary) {
      logger.warn("Gemini returned empty summary");
      throw new AiUnavailableError();
    }

    logger.info(
      { durationMs: Date.now() - startedAt, model: this.model },
      "AI summary generated"
    );

    return summary;
  }
}
