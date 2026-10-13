import { describe, expect, it } from "vitest";
import { tryCatch } from "../../../src/utils/try-catch.ts";

describe("tryCatch", () => {
  it("returns the value when the promise resolves", async () => {
    const result = await tryCatch(Promise.resolve("ok"));

    if (!result.ok) {
      throw new Error("expected ok result");
    }
    expect(result.data).toBe("ok");
  });

  it("returns the rejection reason when the promise rejects", async () => {
    const failure = new Error("boom");
    const result = await tryCatch<string>(Promise.reject(failure));

    if (result.ok) {
      throw new Error("expected error result");
    }
    expect(result.error).toBe(failure);
  });

  it("types the error when explicitly provided", async () => {
    const result = await tryCatch<string, TypeError>(
      Promise.reject(new TypeError("bad type"))
    );

    if (result.ok) {
      throw new Error("expected error result");
    }
    expect(result.error).toBeInstanceOf(TypeError);
  });
});
