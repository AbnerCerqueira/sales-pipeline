import { describe, expect, test } from "vitest";
import { app } from "../../../src/app.ts";
import { HttpStatus } from "../../../src/utils/http-status.ts";

// O frontend roda em origem diferente da API em dev (ex: :5173 -> :3333),
// então todo método usado pelo client precisa passar no preflight do browser.
// Regressão: o default do @fastify/cors permitia só GET,HEAD,POST e o
// PATCH do kanban/modal era bloqueado (card "voltava" para a coluna).
describe("CORS preflight", () => {
  test("allows PATCH from the frontend origin", async () => {
    const response = await app.inject({
      headers: {
        "access-control-request-headers": "authorization,content-type",
        "access-control-request-method": "PATCH",
        origin: "http://localhost:5173",
      },
      method: "OPTIONS",
      url: "/deal/search",
    });

    expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(response.headers["access-control-allow-methods"]).toContain("PATCH");
  });
});
