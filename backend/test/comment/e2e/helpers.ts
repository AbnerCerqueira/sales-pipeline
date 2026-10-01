import type { CreateCommentInput } from "@sales/shared";
import { app } from "../../../src/app.ts";
import { createDealViaHttp } from "../../deal/e2e/helpers.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { CommentRoutes } from "./routes.ts";

export async function commentAuthHeaders(): Promise<Record<string, string>> {
  const { token } = await registerAndLogin();
  return { authorization: `Bearer ${token}` };
}

export async function createCommentPayload(
  overrides: Partial<CreateCommentInput> = {}
): Promise<CreateCommentInput> {
  const dealId =
    overrides.dealId ?? (await createDealViaHttp()).json<{ id: string }>().id;

  return {
    content: "Comentário de teste",
    ...overrides,
    dealId,
  };
}

export async function createCommentViaHttp(
  overrides: Partial<CreateCommentInput> = {}
) {
  const payload = await createCommentPayload(overrides);

  return app.inject({
    headers: await commentAuthHeaders(),
    method: "POST",
    payload,
    url: CommentRoutes.POST.CREATE,
  });
}
