import { randomUUID } from "node:crypto";
import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import { registerAndLogin } from "../../seller/e2e/helpers.ts";
import { DealRoutes } from "./routes.ts";

describe("POST /deal/:id/summary", () => {
  test("returns 404 for missing deal without calling the AI", async () => {
    const { token } = await registerAndLogin();
    const response = await app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      url: DealRoutes.POST.SUMMARY(randomUUID()),
    });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
