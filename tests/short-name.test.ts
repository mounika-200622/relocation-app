import { describe, expect, it } from "vitest";
import { shortName } from "@/lib/format";

describe("shortName", () => {
  it("abbreviates long multi-word organisation names", () => {
    expect(shortName("University College Dublin")).toBe("UCD");
    expect(shortName("Indian Institute of Science")).toBe("IIS");
    expect(shortName("  University of the Arts London ")).toBe("UAL");
  });
  it("keeps short names and two-word names readable", () => {
    expect(shortName("UCD")).toBe("UCD");
    expect(shortName("Trinity College")).toBe("Trinity College");
    expect(shortName("Google")).toBe("Google");
    expect(shortName("Massachusetts Institute")).toBe("Massachusetts Institute");
  });
});
