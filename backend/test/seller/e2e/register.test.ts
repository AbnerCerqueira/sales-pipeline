import { HttpStatus } from "../../../src/utils/http-status.ts";
import {
  createSellerViaHttp,
  loginViaHttp,
  registerViaHttp,
} from "./helpers.ts";

describe("Register Seller", () => {
  test("creates seller and returns 201 with seller data", async () => {
    const seller = await createSellerViaHttp();

    const response = await loginViaHttp({
      email: seller.email,
      password: seller.password,
    });

    expect(response.statusCode).toBe(HttpStatus.OK);

    const body = response.json<{
      seller: { id: string; name: string; email: string };
    }>();

    expect(body.seller).toHaveProperty("id");
    expect(body.seller).toHaveProperty("name");
    expect(body.seller).toHaveProperty("email");
    expect(body.seller.email).toBe(seller.email);
    expect(body.seller.name).toBe(seller.name);
  });

  test("returns 409 when email is already taken", async () => {
    const seller = await createSellerViaHttp();

    const response = await registerViaHttp({
      email: seller.email,
      name: "Another Seller",
      password: "secure-pass-456",
    });

    expect(response.statusCode).toBe(HttpStatus.CONFLICT);
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
