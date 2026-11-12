import type { Connection, TransitProvider } from "@/lib/transit/provider";

/** transport.opendata.ch duration format "00d01:23:00" → minutes */
export function parseDuration(d: string | null | undefined) {
  const m = d?.match(/^(\d+)d(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 1440 + Number(m[2]) * 60 + Number(m[3]);
}

type ApiConnection = {
  from: { departure: string; platform: string | null; station: { name: string } };
  to: { arrival: string; station: { name: string } };
  duration: string;
  transfers: number;
  products: string[];
  sections: {
    journey: { category: string; number: string; name?: string } | null;
    walk: { duration: number | null } | null;
    departure: { departure: string | null; platform: string | null; station: { name: string } };
    arrival: { arrival: string | null; station: { name: string } };
  }[];
};

/** Free Swiss public transport API (no key): https://transport.opendata.ch */
export class SwissTransitProvider implements TransitProvider {
  readonly name = "transport.opendata.ch";
  readonly countries = ["CH", "LI"];
  private base = "https://transport.opendata.ch/v1";

  private async get<T>(path: string, params: Record<string, string>) {
    const url = new URL(this.base + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, { headers: { "User-Agent": process.env.NOMINATIM_USER_AGENT || "Nira-Student-Project/1.0" }, signal: AbortSignal.timeout(12_000) });
    if (!res.ok) throw new Error(`transport.opendata.ch ${res.status}`);
    return (await res.json()) as T;
  }

  async connections(from: string, to: string, when: { date?: string; time?: string; arrival?: boolean } = {}): Promise<Connection[]> {
    const params: Record<string, string> = { from, to, limit: "5" };
    if (when.date) params.date = when.date;
    if (when.time) params.time = when.time;
    if (when.arrival) params.isArrivalTime = "1";
    const data = await this.get<{ connections: ApiConnection[] }>("/connections", params);
    return data.connections.map((c) => ({
      departure: c.from.departure,
      arrival: c.to.arrival,
      durationMinutes: parseDuration(c.duration),
      transfers: c.transfers,
      products: c.products,
      legs: c.sections.map((s) => ({
        mode: s.walk ? "WALK" : s.journey?.category ?? "?",
        line: s.journey ? `${s.journey.category}${s.journey.number ? " " + s.journey.number : ""}` : null,
        from: s.departure.station.name,
        to: s.arrival.station.name,
        departure: s.departure.departure ?? c.from.departure,
        arrival: s.arrival.arrival ?? c.to.arrival,
        platform: s.departure.platform,
        walkMinutes: s.walk?.duration ? Math.round(s.walk.duration / 60) : undefined,
      })),
    }));
  }

  async stations(query: string) {
    const data = await this.get<{ stations: { id: string | null; name: string | null }[] }>("/locations", { query, type: "station" });
    return data.stations.filter((s) => s.id && s.name).slice(0, 8).map((s) => ({ id: s.id!, name: s.name! }));
  }
}
