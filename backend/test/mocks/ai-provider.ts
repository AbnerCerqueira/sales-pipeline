import type {
  AiProvider,
  SummarizeDealInput,
} from "../../src/modules/deal/services/ai-provider.ts";

export class MockAiProvider implements AiProvider {
  private summary = "Resumo fake para teste";
  receivedInput: SummarizeDealInput | null = null;

  willSummarize(summary: string) {
    this.summary = summary;
  }

  summarizeDeal(input: SummarizeDealInput): Promise<string> {
    this.receivedInput = input;
    return Promise.resolve(this.summary);
  }
}
