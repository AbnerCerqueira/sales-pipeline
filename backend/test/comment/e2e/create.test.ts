import { randomUUID } from "node:crypto";
import { commentDTOSchema } from "@sales/shared";
import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createDealViaHttp } from "../../deal/e2e/helpers.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import {
  commentAuthHeaders,
  createCommentPayload,
  createCommentViaHttp,
} from "./helpers.ts";
import { CommentRoutes } from "./routes.ts";

describe("POST /comment", () => {
  test("creates comment authored by the authenticated seller", async () => {
    const { seller, token } = await registerAndLogin();
    const dealId = (await createDealViaHttp()).json<{ id: string }>().id;

    const response = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      payload: { content: "Vou ligar amanhã", dealId },
      url: CommentRoutes.POST.CREATE,
    });

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const comment = commentDTOSchema.parse(response.json());

    expect(comment.content).toBe("Vou ligar amanhã");
    expect(comment.dealId).toBe(dealId);
    expect(comment.seller).toMatchObject({
      email: seller.email,
      name: seller.name,
    });
    expect(
      Math.abs(Date.now() - new Date(comment.createdAt).getTime())
    ).toBeLessThan(60_000);
  });

  test("keeps the token's seller as author even when body forges sellerId", async () => {
    const { seller, token } = await registerAndLogin();
    const dealId = (await createDealViaHttp()).json<{ id: string }>().id;

    const response = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      payload: { content: "sellerId forjado", dealId, sellerId: randomUUID() },
      url: CommentRoutes.POST.CREATE,
    });

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const comment = commentDTOSchema.parse(response.json());

    expect(comment.seller.email).toBe(seller.email);
  });

  test("trims content", async () => {
    const response = await createCommentViaHttp({ content: "  boa tarde  " });

    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(commentDTOSchema.parse(response.json()).content).toBe("boa tarde");
  });

  test("returns 404 when deal does not exist", async () => {
    const response = await createCommentViaHttp({ dealId: randomUUID() });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  test("returns 400 when content is empty", async () => {
    const response = await createCommentViaHttp({ content: "   " });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  test("returns 400 when dealId is not a uuid", async () => {
    const payload = await createCommentPayload({ dealId: "not-a-uuid" });

    const response = await app.inject({
      headers: await commentAuthHeaders(),
      method: "POST",
      payload,
      url: CommentRoutes.POST.CREATE,
    });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  test("returns 401 when token is missing", async () => {
    const payload = await createCommentPayload();

    const response = await app.inject({
      method: "POST",
      payload,
      url: CommentRoutes.POST.CREATE,
    });

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });
});
