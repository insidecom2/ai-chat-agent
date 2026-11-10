import { describe, it, expect } from "vitest";
import { getDefaultModel } from "@/store/modelStore";

describe("getDefaultModel", () => {
  it("prefers Gemini when available", () => {
    const result = getDefaultModel([
      { name: "llama3.1:8b" },
      { name: "gemini-2.5-flash" },
      { name: "gemma3:4b" },
    ]);

    expect(result).toBe("gemini-2.5-flash");
  });

  it("falls back to the first available model when no Gemini model exists", () => {
    const result = getDefaultModel([
      { name: "llama3.1:8b" },
      { name: "deepseek-r1:7b" },
    ]);

    expect(result).toBe("llama3.1:8b");
  });
});
