import { describe, expect, it } from "vitest";
import { reorderDealIds } from "../../../src/modules/deal/deal-order.ts";

describe("reorderDealIds", () => {
  it("moves a deal to the top when there is no anchor", () => {
    expect(reorderDealIds(["a", "b", "c"], "c", null)).toEqual(["c", "a", "b"]);
  });

  it("moves a deal right after its anchor", () => {
    expect(reorderDealIds(["a", "b", "c"], "c", "a")).toEqual(["a", "c", "b"]);
  });

  it("moves a deal to the end when the anchor is the last one", () => {
    expect(reorderDealIds(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
  });

  it("moves a deal backwards inside the same column", () => {
    expect(reorderDealIds(["a", "b", "c", "d"], "d", "b")).toEqual([
      "a",
      "b",
      "d",
      "c",
    ]);
  });

  it("falls back to the top when the anchor no longer exists", () => {
    expect(reorderDealIds(["a", "b", "c"], "c", "ghost")).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("keeps a single deal list unchanged", () => {
    expect(reorderDealIds(["only"], "only", null)).toEqual(["only"]);
  });

  it("does not mutate the received list", () => {
    const ids = ["a", "b", "c"];

    reorderDealIds(ids, "a", "c");

    expect(ids).toEqual(["a", "b", "c"]);
  });
});
