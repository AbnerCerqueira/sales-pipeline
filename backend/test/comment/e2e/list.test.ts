import { randomUUID } from "node:crypto";
import { commentDTOSchema } from "@sales/shared";
import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createDealViaHttp } from "../../deal/e2e/helpers.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { commentAuthHeaders, createCommentViaHttp } from "./helpers.ts";
import { CommentRoutes } from "./routes.ts";

describe("GET /comment/deal/:dealId", () => {
  test("lists deal comments in chronological order with authors", async () => {
    const { seller, token } = await registerAndLogin();
    const headers = { authorization: `Bearer ${token}` };
    const dealId = (await createDealViaHttp()).json<{ id: string }>().id;

    const first = await app.inject({
      headers,
      method: "POST",
      payload: { content: "Primeiro comentário", dealId },
      url: CommentRoutes.POST.CREATE,
    });
    const second = await app.inject({
      headers,
      method: "POST",
      payload: { content: "Segundo comentário", dealId },
      url: CommentRoutes.POST.CREATE,
    });
    expect(first.statusCode).toBe(HttpStatus.CREATED);
    expect(second.statusCode).toBe(HttpStatus.CREATED);

    const response = await app.inject({
      headers,
      method: "GET",
      url: CommentRoutes.GET.LIST_BY_DEAL(dealId),
    });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const comments = commentDTOSchema.array().parse(response.json());

    expect(comments.map((comment) => comment.content)).toEqual([
      "Primeiro comentário",
      "Segundo comentário",
    ]);
    for (const comment of comments) {
      expect(comment.dealId).toBe(dealId);
      expect(comment.seller.email).toBe(seller.email);
    }
  });

  test("returns empty list when deal has no comments", async () => {
    const dealId = (await createDealViaHttp()).json<{ id: string }>().id;

    const response = await app.inject({
      headers: await commentAuthHeaders(),
      method: "GET",
      url: CommentRoutes.GET.LIST_BY_DEAL(dealId),
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.json()).toEqual([]);
  });

  test("returns only comments from the requested deal", async () => {
    const headers = await commentAuthHeaders();
    const dealId = (await createDealViaHttp()).json<{ id: string }>().id;
    const otherDealId = (await createDealViaHttp()).json<{ id: string }>().id;

    await createCommentViaHttp({ content: "Do deal certo", dealId });
    await createCommentViaHttp({
      content: "De outro deal",
      dealId: otherDealId,
    });

    const response = await app.inject({
      headers,
      method: "GET",
      url: CommentRoutes.GET.LIST_BY_DEAL(dealId),
    });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const comments = commentDTOSchema.array().parse(response.json());

    expect(comments.map((comment) => comment.content)).toEqual([
      "Do deal certo",
    ]);
  });

  test("returns empty list for a deal that does not exist", async () => {
    const response = await app.inject({
      headers: await commentAuthHeaders(),
      method: "GET",
      url: CommentRoutes.GET.LIST_BY_DEAL(randomUUID()),
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.json()).toEqual([]);
  });

  test("returns 400 when dealId is not a uuid", async () => {
    const response = await app.inject({
      headers: await commentAuthHeaders(),
      method: "GET",
      url: CommentRoutes.GET.LIST_BY_DEAL("not-a-uuid"),
    });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  test("returns 401 when token is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: CommentRoutes.GET.LIST_BY_DEAL(randomUUID()),
    });

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });
});
