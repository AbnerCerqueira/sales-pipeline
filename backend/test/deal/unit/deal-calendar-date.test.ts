import type { LeadSummary, SellerSummary } from "@sales/shared";
import { describe, expect, it } from "vitest";
import { Deal, type DealInput } from "../../../src/modules/deal/deal.ts";

process.env.TZ = "Asia/Tokyo";

const SELLER: SellerSummary = {
  email: "seller@example.com",
  id: "3d6b1a2e-0000-4000-8000-000000000000",
  name: "Seller",
};

const LEAD: LeadSummary = {
  companyName: "Acme",
  email: "lead@example.com",
  fullName: "Lead",
  id: "9a1c7f30-0000-4000-8000-000000000000",
  whatsapp: "(11) 99999-8888",
};

function input(overrides: Partial<DealInput> = {}): DealInput {
  return {
    description: null,
    expectedCloseDate: "2026-01-30",
    leadId: LEAD.id,
    responsibleId: SELLER.id,
    status: "open",
    title: "Deal",
    value: 100,
    ...overrides,
  };
}

describe("Deal expectedCloseDate", () => {
  it("ancora a data de calendário na meia-noite UTC", () => {
    const deal = Deal.create(input());

    expect(deal.expectedCloseDate?.toISOString()).toBe(
      "2026-01-30T00:00:00.000Z"
    );
  });

  it("não desloca o dia no round-trip pelo DTO", () => {
    const dto = Deal.create(input()).toDTO(SELLER, LEAD);

    expect(dto.expectedCloseDate).toBe("2026-01-30T00:00:00.000Z");
  });

  it("não desloca o dia ao vir do banco", () => {
    const deal = Deal.fromPersistence(input(), "1", {
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(deal.expectedCloseDate?.toISOString()).toBe(
      "2026-01-30T00:00:00.000Z"
    );
  });

  it("preserva a data quando outro campo muda", () => {
    const deal = Deal.create(input()).mutate({ title: "Renomeado" });

    expect(deal.expectedCloseDate?.toISOString()).toBe(
      "2026-01-30T00:00:00.000Z"
    );
  });

  it("aceita ausência de data prevista", () => {
    const deal = Deal.create(input({ expectedCloseDate: null }));

    expect(deal.expectedCloseDate).toBe(null);
    expect(deal.toDTO(SELLER, LEAD).expectedCloseDate).toBe(null);
  });

  it("aceita a virada de ano e de mês", () => {
    expect(
      Deal.create(input({ expectedCloseDate: "2026-12-31" })).toDTO(
        SELLER,
        LEAD
      ).expectedCloseDate
    ).toBe("2026-12-31T00:00:00.000Z");
  });
});
