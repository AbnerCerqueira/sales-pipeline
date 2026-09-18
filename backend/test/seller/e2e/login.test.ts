import { HttpStatus } from "../../../src/utils/http-status.ts";
import { createSellerViaHttp, loginViaHttp } from "./helpers.ts";

describe("Login Seller", () => {
  test("returns token on valid credentials", async () => {
    const seller = await createSellerViaHttp();

    const response = await loginViaHttp({
      email: seller.email,
      password: seller.password,
    });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const body = response.json<{ token: string }>();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe("string");
  });

  test("returns 401 for wrong password", async () => {
    const seller = await createSellerViaHttp();

    const response = await loginViaHttp({
      email: seller.email,
      password: "wrong-password",
    });

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  test("returns 401 for non-existent email", async () => {
    const response = await loginViaHttp({
      email: "nonexistent@email.com",
      password: "any-password",
    });

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  test("returns seller data in response body", async () => {
    const seller = await createSellerViaHttp();

    const response = await loginViaHttp({
      email: seller.email,
      password: seller.password,
    });

    const body = response.json<{
      seller: { id: string; name: string; email: string };
    }>();

    expect(body.seller).toHaveProperty("id");
    expect(body.seller).toHaveProperty("name");
    expect(body.seller).toHaveProperty("email");
    expect(body.seller.email).toBe(seller.email);
    expect(body.seller.name).toBe(seller.name);
  });

  test("does not return password in response", async () => {
    const seller = await createSellerViaHttp();

    const response = await loginViaHttp({
      email: seller.email,
      password: seller.password,
    });

    const body = response.json<{ seller: Record<string, unknown> }>();
    expect(body.seller.password).toBeUndefined();
  });
});
