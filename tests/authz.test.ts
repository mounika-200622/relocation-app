import { describe, expect, it } from "vitest";
import { canManageListing, homeFor, isParticipant, pageAccess, safeCallbackUrl } from "@/lib/authz";

describe("pageAccess", () => {
  it("sends anonymous visitors of protected pages to login", () => {
    expect(pageAccess("/relocate/home", null)).toBe("login");
    expect(pageAccess("/chat/12", null)).toBe("login");
    expect(pageAccess("/admin", undefined)).toBe("login");
  });
  it("lets anyone see public pages", () => {
    expect(pageAccess("/", null)).toBe("allow");
    expect(pageAccess("/listings/5", null)).toBe("allow");
    expect(pageAccess("/guide/ch", null)).toBe("allow");
    expect(pageAccess("/share/abc", null)).toBe("allow");
    // searching homes is open to visitors (the hero search and "Explore homes" tab land here)
    expect(pageAccess("/relocate", null)).toBe("allow");
  });
  it("enforces business-only pages", () => {
    expect(pageAccess("/business", "USER")).toBe("forbidden");
    expect(pageAccess("/business/listings/3/edit", "BUSINESS")).toBe("allow");
    expect(pageAccess("/list-a-place", "USER")).toBe("forbidden");
  });
  it("enforces user-only pages", () => {
    expect(pageAccess("/relocate/home", "BUSINESS")).toBe("forbidden");
    expect(pageAccess("/trip/new", "USER")).toBe("allow");
  });
  it("enforces admin-only pages", () => {
    expect(pageAccess("/admin/users", "BUSINESS")).toBe("forbidden");
    expect(pageAccess("/admin/users", "ADMIN")).toBe("allow");
  });
  it("does not confuse prefixes", () => {
    expect(pageAccess("/administrator-info", null)).toBe("allow");
  });
  it("allows any logged-in role on shared pages", () => {
    expect(pageAccess("/chat", "BUSINESS")).toBe("allow");
    expect(pageAccess("/profile", "USER")).toBe("allow");
  });
});

describe("helpers", () => {
  it("routes roles home", () => {
    expect(homeFor("BUSINESS")).toBe("/business");
    expect(homeFor("ADMIN")).toBe("/admin");
    expect(homeFor("USER")).toBe("/choose-path");
  });
  it("only owners or admins manage a listing", () => {
    expect(canManageListing({ id: 1, role: "BUSINESS" }, { ownerId: 1 })).toBe(true);
    expect(canManageListing({ id: 2, role: "BUSINESS" }, { ownerId: 1 })).toBe(false);
    expect(canManageListing({ id: 9, role: "ADMIN" }, { ownerId: 1 })).toBe(true);
  });
  it("checks conversation participants", () => {
    expect(isParticipant(3, { userAId: 3, userBId: 7 })).toBe(true);
    expect(isParticipant(4, { userAId: 3, userBId: 7 })).toBe(false);
  });
  it("rejects open-redirect callback URLs", () => {
    expect(safeCallbackUrl("/relocate?x=1")).toBe("/relocate?x=1");
    expect(safeCallbackUrl("https://evil.com")).toBe("/");
    expect(safeCallbackUrl("//evil.com")).toBe("/");
    expect(safeCallbackUrl("/\\evil.com")).toBe("/");
    expect(safeCallbackUrl(null, "/home")).toBe("/home");
  });
});
