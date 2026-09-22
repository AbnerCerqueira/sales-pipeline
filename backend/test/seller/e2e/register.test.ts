import { randomUUID } from "node:crypto";
import { HttpStatus } from "../../../src/utils/http-status.ts";
import {
  createSellerViaHttp,
  DEFAULT_PASSWORD,
  loginViaHttp,
  registerViaHttp,
} from "./helpers.ts";

describe("Register Seller", () => {
  test("creates seller and returns 201 with seller data", async () => {
    const suffix = randomUUID().slice(0, 8);
    const response = await registerViaHttp({
      email: `seller+${suffix}@example.com`,
      name: `Seller ${suffix}`,
      password: DEFAULT_PASSWORD,
    });

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const body = response.json<{
      email: string;
      id: string;
      name: string;
    }>();

    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("name");
    expect(body).toHaveProperty("email");
    expect(body.email).toBe(`seller+${suffix}@example.com`);
    expect(body.name).toBe(`Seller ${suffix}`);
  });

  test("returns 409 when email is already taken", async () => {
    const seller = await createSellerViaHttp();

    const response = await registerViaHttp({
      email: seller.email,
      name: "Another Seller",
      password: DEFAULT_PASSWORD,
    });

    expect(response.statusCode).toBe(HttpStatus.CONFLICT);
  });

  test("does not return password in response", async () => {
    const suffix = randomUUID().slice(0, 8);
    const response = await registerViaHttp({
      email: `seller+${suffix}@example.com`,
      name: `Seller ${suffix}`,
      password: DEFAULT_PASSWORD,
    });

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const body = response.json<Record<string, unknown>>();
    expect(body.password).toBeUndefined();
  });

  test("registered seller can login", async () => {
    const seller = await createSellerViaHttp();

    const loginResponse = await loginViaHttp({
      email: seller.email,
      password: seller.password,
    });

    expect(loginResponse.statusCode).toBe(HttpStatus.OK);

    const body = loginResponse.json<{ token: string }>();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe("string");
  });
});
