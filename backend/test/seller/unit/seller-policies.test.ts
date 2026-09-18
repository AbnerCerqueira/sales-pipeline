import { describe, expect, it } from "vitest";
import { Seller } from "../../../src/modules/seller/seller.ts";
import {
  EmailTakenError,
  InvalidCredentialsError,
  SellerPolicies,
} from "../../../src/modules/seller/seller-policies.ts";
import type { PasswordHasher } from "../../../src/modules/seller/services/password-hasher.ts";
import { MockSellerRepository } from "../../mocks/seller-repository.ts";

class MockPasswordHasher implements PasswordHasher {
  private result = true;
  readonly calls: { hashedPassword: string; password: string }[] = [];

  willReturn(result: boolean) {
    this.result = result;
  }

  compare(password: string, hashedPassword: string) {
    this.calls.push({ hashedPassword, password });
    return Promise.resolve(this.result);
  }

  hash(password: string) {
    return Promise.resolve(`hashed-${password}`);
  }
}

function createSeller(overrides?: { password?: string }) {
  return Seller.create({
    email: "john@example.com",
    name: "John Doe",
    password: overrides?.password ?? "hashed-password-123",
  });
}

describe("SellerPolicies", () => {
  describe("assertCredentials", () => {
    it("does not throw when password matches", async () => {
      const hasher = new MockPasswordHasher();
      hasher.willReturn(true);
      const repository = new MockSellerRepository();
      const policies = new SellerPolicies(hasher, repository);

      await expect(
        policies.assertCredentials(createSeller(), "any-password")
      ).resolves.toBeUndefined();
    });

    it("calls compare with correct arguments", async () => {
      const hasher = new MockPasswordHasher();
      hasher.willReturn(true);
      const repository = new MockSellerRepository();
      const policies = new SellerPolicies(hasher, repository);
      const seller = createSeller({ password: "stored-hash" });

      await policies.assertCredentials(seller, "my-secret");

      expect(hasher.calls).toHaveLength(1);
      expect(hasher.calls[0]).toEqual({
        hashedPassword: "stored-hash",
        password: "my-secret",
      });
    });

    it("throws InvalidCredentialsError when password does not match", async () => {
      const hasher = new MockPasswordHasher();
      hasher.willReturn(false);
      const repository = new MockSellerRepository();
      const policies = new SellerPolicies(hasher, repository);

      await expect(
        policies.assertCredentials(createSeller(), "wrong-password")
      ).rejects.toSatisfy((error) => {
        expect(error).toBeInstanceOf(InvalidCredentialsError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe("E-mail ou senha inválidos");
        return true;
      });
    });
  });

  describe("assertEmailAvailable", () => {
    it("does not throw when email is not taken", async () => {
      const hasher = new MockPasswordHasher();
      const repository = new MockSellerRepository();
      repository.willFind(null);
      const policies = new SellerPolicies(hasher, repository);

      await expect(
        policies.assertEmailAvailable("new@example.com")
      ).resolves.toBeUndefined();
    });

    it("throws EmailTakenError when email is already taken", async () => {
      const hasher = new MockPasswordHasher();
      const repository = new MockSellerRepository();
      repository.willFind(createSeller());
      const policies = new SellerPolicies(hasher, repository);

      await expect(
        policies.assertEmailAvailable("john@example.com")
      ).rejects.toSatisfy((error) => {
        expect(error).toBeInstanceOf(EmailTakenError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe("E-mail já cadastrado");
        return true;
      });
    });
  });
});
