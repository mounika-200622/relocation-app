/** A live public-transport connection search, implemented per country. */
export type Leg = { mode: string; line: string | null; from: string; to: string; departure: string; arrival: string; platform: string | null; walkMinutes?: number };
export type Connection = { departure: string; arrival: string; durationMinutes: number; transfers: number; products: string[]; legs: Leg[] };

export interface TransitProvider {
  readonly name: string;
  readonly countries: string[];
  connections(from: string, to: string, when?: { date?: string; time?: string; arrival?: boolean }): Promise<Connection[]>;
  stations(query: string): Promise<{ id: string; name: string }[]>;
}

export async function providerForCountry(iso: string): Promise<TransitProvider | null> {
  if (iso === "CH" || iso === "LI") {
    const { SwissTransitProvider } = await import("@/lib/transit/swiss");
    return new SwissTransitProvider();
  }
  return null;
}
