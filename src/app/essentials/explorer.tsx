"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { CitySearch } from "@/components/city-search";
import { EssentialsPanel } from "@/components/essentials-panel";
import { getPosition } from "@/lib/position";
import { toast } from "sonner";

export function EssentialsExplorer({ lat, lng, cityId, label }: { lat: number; lng: number; cityId: number | null; label: string }) {
  const [pt, setPt] = useState({ lat, lng, cityId, label });
  return (
    <div className="space-y-8">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span className="inline-flex items-center gap-2 text-sm text-muted"><MapPin className="h-4 w-4 text-warm" /> Around</span>
        <CitySearch
          className="flex-1"
          inputClassName="text-[15px]"
          initialLabel={pt.label}
          onSelect={(c) => c.lat && c.lng && setPt({ lat: c.lat, lng: c.lng, cityId: c.id, label: `${c.name}, ${c.country.name}` })}
        />
        <button
          className="text-sm font-medium text-accent hover:underline"
          onClick={() => getPosition().then((p) => setPt({ lat: p.lat, lng: p.lng, cityId: null, label: "My location" })).catch((e: Error) => toast.error(e.message))}
        >
          Use my location
        </button>
      </div>
      <EssentialsPanel key={`${pt.lat},${pt.lng}`} lat={pt.lat} lng={pt.lng} cityId={pt.cityId} title={`Around ${pt.label}`} />
    </div>
  );
}
