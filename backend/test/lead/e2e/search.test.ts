import type { LeadDTO, SearchLeadsResponse } from "@sales/shared";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createSellerViaHttp } from "../../seller/e2e/helpers.ts";
import { createLeadViaHttp, searchLeadsViaHttp } from "./helpers.ts";

describe("Search Leads", () => {
  test("returns only leads whose name contains the searched characters", async () => {
    const target = await createLeadViaHttp({ fullName: "Ada Lovelace" });
    await createLeadViaHttp({ fullName: "Alan Turing" });

    const response = await searchLeadsViaHttp({ name: "lovel" });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const { items } = response.json<SearchLeadsResponse>();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(target.json<LeadDTO>().id);
    expect(items[0].fullName).toBe("Ada Lovelace");
  });

  test("returns only leads owned by the informed seller", async () => {
    const seller = await createSellerViaHttp();
    const otherSeller = await createSellerViaHttp();

    const target = await createLeadViaHttp({ responsibleId: seller.id });
    await createLeadViaHttp({ responsibleId: otherSeller.id });

    const response = await searchLeadsViaHttp({ responsibleId: seller.id });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const { items } = response.json<SearchLeadsResponse>();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(target.json<LeadDTO>().id);
    expect(items[0].responsible).toEqual({
      email: seller.email,
      id: seller.id,
      name: seller.name,
    });
  });

  test("combines name and responsible filters", async () => {
    const seller = await createSellerViaHttp();
    const otherSeller = await createSellerViaHttp();

    const target = await createLeadViaHttp({
      fullName: "Ada Lovelace",
      responsibleId: seller.id,
    });
    await createLeadViaHttp({
      fullName: "Ada Lovelace",
      responsibleId: otherSeller.id,
    });
    await createLeadViaHttp({
      fullName: "Grace Hopper",
      responsibleId: seller.id,
    });

    const response = await searchLeadsViaHttp({
      name: "ada",
      responsibleId: seller.id,
    });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const { items } = response.json<SearchLeadsResponse>();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(target.json<LeadDTO>().id);
    expect(items[0].responsibleId).toBe(seller.id);
  });

  test("defaults to first page with 10 items when no filter is provided", async () => {
    const first = await createLeadViaHttp();
    const second = await createLeadViaHttp();

    const response = await searchLeadsViaHttp();

    expect(response.statusCode).toBe(HttpStatus.OK);

    const body = response.json<SearchLeadsResponse>();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
    expect(body.total).toBe(2);
    expect(body.items.map((lead) => lead.id)).toEqual([
      second.json<LeadDTO>().id,
      first.json<LeadDTO>().id,
    ]);
  });

  test("paginates results", async () => {
    const first = await createLeadViaHttp();
    const second = await createLeadViaHttp();
    const third = await createLeadViaHttp();

    const firstPage = await searchLeadsViaHttp({ pageSize: 2 });

    expect(firstPage.statusCode).toBe(HttpStatus.OK);

    const pageOne = firstPage.json<SearchLeadsResponse>();
    expect(pageOne.page).toBe(1);
    expect(pageOne.pageSize).toBe(2);
    expect(pageOne.total).toBe(3);
    expect(pageOne.items.map((lead) => lead.id)).toEqual([
      third.json<LeadDTO>().id,
      second.json<LeadDTO>().id,
    ]);

    const secondPage = await searchLeadsViaHttp({ page: 2, pageSize: 2 });

    expect(secondPage.statusCode).toBe(HttpStatus.OK);

    const pageTwo = secondPage.json<SearchLeadsResponse>();
    expect(pageTwo.page).toBe(2);
    expect(pageTwo.total).toBe(3);
    expect(pageTwo.items.map((lead) => lead.id)).toEqual([
      first.json<LeadDTO>().id,
    ]);
  });

  test("returns empty array when no lead matches", async () => {
    await createLeadViaHttp({ fullName: "Ada Lovelace" });

    const response = await searchLeadsViaHttp({ name: "turing" });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const body = response.json<SearchLeadsResponse>();
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });
});
