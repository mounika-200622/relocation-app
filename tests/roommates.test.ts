import { describe, expect, it } from "vitest";
import { decideAccept, type ListingState } from "@/lib/roommate-rules";

const listing = (over: Partial<ListingState> = {}): ListingState => ({ ownerId: 1, status: "ACTIVE", isShareable: true, capacityMax: 3, currentOccupants: 1, ...over });
const open = { status: "OPEN", requesterId: 9 };

describe("decideAccept (accept-request transaction rules)", () => {
  it("accepts when there is room and reports whether the place becomes full", () => {
    expect(decideAccept(1, listing(), open)).toEqual({ ok: true, becomesFull: false });
    expect(decideAccept(1, listing({ currentOccupants: 2 }), open)).toEqual({ ok: true, becomesFull: true });
  });
  it("only the owner may accept", () => {
    expect(decideAccept(2, listing(), open)).toMatchObject({ ok: false, status: 403 });
  });
  it("rejects when the place is already full (the race-condition guard)", () => {
    expect(decideAccept(1, listing({ currentOccupants: 3 }), open)).toMatchObject({ ok: false, status: 409 });
  });
  it("rejects requests that are not open", () => {
    for (const status of ["MATCHED", "CLOSED", "WITHDRAWN"]) {
      expect(decideAccept(1, listing(), { ...open, status })).toMatchObject({ ok: false, status: 409 });
    }
  });
  it("rejects non-shareable or inactive places", () => {
    expect(decideAccept(1, listing({ isShareable: false }), open)).toMatchObject({ ok: false });
    expect(decideAccept(1, listing({ status: "ARCHIVED" }), open)).toMatchObject({ ok: false });
  });
  it("two accepts against the same locked state cannot both fill the last spot", () => {
    const state = listing({ capacityMax: 2, currentOccupants: 1 });
    const first = decideAccept(1, state, open);
    expect(first.ok).toBe(true);
    // the transaction applies the first accept before the second one reads the row
    const after = { ...state, currentOccupants: state.currentOccupants + 1 };
    expect(decideAccept(1, after, open)).toMatchObject({ ok: false, status: 409 });
  });
});
