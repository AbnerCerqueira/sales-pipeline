import { describe, expect, it } from "vitest";
import { Comment } from "../../../src/modules/comment/comment.ts";
import { Deal } from "../../../src/modules/deal/deal.ts";
import { SummarizeDealUseCase } from "../../../src/modules/deal/use-cases/summarize-deal-use-case.ts";
import { DealNotFoundError } from "../../../src/modules/deal/use-cases/update-deal-use-case.ts";
import { Lead } from "../../../src/modules/lead/lead.ts";
import { Seller } from "../../../src/modules/seller/seller.ts";
import { MockAiProvider } from "../../mocks/ai-provider.ts";
import { MockCommentRepository } from "../../mocks/comment-repository.ts";
import { MockDealRepository } from "../../mocks/deal-repository.ts";
import { MockLeadRepository } from "../../mocks/lead-repository.ts";

function createDeal() {
  return Deal.create({
    description: "Proposta enviada",
    expectedCloseDate: "2026-10-15",
    leadId: "lead-id",
    responsibleId: "seller-id",
    status: "negotiating",
    title: "Deal Acme",
    value: 30_000,
  });
}

function createLead() {
  return Lead.create({
    companyName: "Acme",
    description: null,
    email: "lead@example.com",
    fullName: "John Lead",
    responsibleId: "seller-id",
    source: "inbound",
    whatsapp: "(11) 99999-0000",
  });
}

function createSeller() {
  return Seller.create({
    email: "s@example.com",
    name: "Seller",
    password: "x",
  });
}

function setup() {
  const dealRepository = new MockDealRepository();
  const leadRepository = new MockLeadRepository();
  const commentRepository = new MockCommentRepository();
  const aiProvider = new MockAiProvider();
  const useCase = new SummarizeDealUseCase(
    dealRepository,
    leadRepository,
    commentRepository,
    aiProvider
  );
  return {
    aiProvider,
    commentRepository,
    dealRepository,
    leadRepository,
    useCase,
  };
}

describe("SummarizeDealUseCase", () => {
  it("returns the AI summary mapping deal, lead and comments", async () => {
    const {
      aiProvider,
      commentRepository,
      dealRepository,
      leadRepository,
      useCase,
    } = setup();
    const deal = createDeal();
    const seller = createSeller();
    dealRepository.willFind(deal);
    leadRepository.willFind(createLead());
    commentRepository.willList([
      {
        comment: Comment.create({
          content: "Cliente pediu desconto",
          dealId: deal.id,
          sellerId: seller.id,
        }),
        seller,
      },
    ]);
    aiProvider.willSummarize("Resumo do deal");

    const result = await useCase.execute(deal.id);

    expect(result).toEqual({ summary: "Resumo do deal" });
    expect(aiProvider.receivedInput).toEqual({
      comments: ["Cliente pediu desconto"],
      description: "Proposta enviada",
      expectedCloseDate: "2026-10-15",
      leadName: "John Lead (Acme)",
      status: "negotiating",
      title: "Deal Acme",
      value: 30_000,
    });
  });

  it("throws DealNotFoundError without calling the AI when the deal does not exist", async () => {
    const { aiProvider, useCase } = setup();

    await expect(useCase.execute("missing-id")).rejects.toBeInstanceOf(
      DealNotFoundError
    );
    expect(aiProvider.receivedInput).toBeNull();
  });
});
