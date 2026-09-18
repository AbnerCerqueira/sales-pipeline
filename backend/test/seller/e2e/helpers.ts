import { randomUUID } from "node:crypto";
import { app } from "../../../src/app.ts";
import { SellerRoutes } from "./routes.ts";

const DEFAULT_PASSWORD = "secret123";

export type CreateSellerInput = {
  email: string;
  name: string;
  password: string;
};

export function registerViaHttp(input: {
  name: string;
  email: string;
  password: string;
}) {
  return app.inject({
    method: "POST",
    payload: input,
    url: SellerRoutes.POST.REGISTER,
  });
}

export async function createSellerViaHttp(
  overrides?: Partial<CreateSellerInput>
): Promise<CreateSellerInput> {
  const suffix = randomUUID().slice(0, 8);
  const seller: CreateSellerInput = {
    email: overrides?.email ?? `seller+${suffix}@example.com`,
    name: overrides?.name ?? `Seller ${suffix}`,
    password: overrides?.password ?? DEFAULT_PASSWORD,
  };

  await registerViaHttp(seller);

  return seller;
}

export function loginViaHttp(input: { email: string; password: string }) {
  return app.inject({
    method: "POST",
    payload: input,
    url: SellerRoutes.POST.LOGIN,
  });
}

export async function registerAndLogin() {
  const suffix = randomUUID().slice(0, 8);
  const email = `seller+${suffix}@example.com`;
  const password = DEFAULT_PASSWORD;

  await registerViaHttp({
    email,
    name: `Seller ${suffix}`,
    password,
  });

  const response = await loginViaHttp({ email, password });

  return {
    seller: { email, name: `Seller ${suffix}`, password },
    token: response.json<{ token: string }>().token,
  };
}
