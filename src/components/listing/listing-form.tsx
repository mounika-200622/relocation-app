"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip, Field, Input, Segmented, Select, Switch, Textarea } from "@/components/ui/field";
import { LocationPicker, type CityMeta } from "@/components/location-picker";
import { MapPanel } from "@/components/map";
import { api } from "@/lib/client";
import { listingCreateSchema } from "@/lib/validators/listing";

export type ListingFormValues = {
  title: string; description: string; type: string; address: string; cityId: number | null; lat: number | null; lng: number | null;
  price: string; deposit: string; currency: string; bedrooms: string; bathrooms: string; sizeSqm: string; furnished: boolean;
  availableFrom: string; minStayMonths: string; utilitiesIncluded: boolean; billsEstimate: string; petsAllowed: boolean; smokingAllowed: boolean;
  guestsAllowed: boolean; isShareable: boolean; capacityMin: string; capacityMax: string; currentOccupants: string; genderPreference: string; amenityIds: number[];
};

export const EMPTY_LISTING: ListingFormValues = {
  title: "", description: "", type: "PRIVATE_ROOM", address: "", cityId: null, lat: null, lng: null, price: "", deposit: "", currency: "", bedrooms: "1",
  bathrooms: "1", sizeSqm: "", furnished: true, availableFrom: "", minStayMonths: "3", utilitiesIncluded: true, billsEstimate: "", petsAllowed: false,
  smokingAllowed: false, guestsAllowed: true, isShareable: false, capacityMin: "1", capacityMax: "1", currentOccupants: "0", genderPreference: "ANYONE", amenityIds: [],
};

const TYPES = [["DORM", "Dorm"], ["SHARED_ROOM", "Shared room"], ["PRIVATE_ROOM", "Private room"], ["STUDIO", "Studio"], ["APARTMENT", "Apartment"]] as const;

/** Create / edit a listing. Location comes from the DB picker; coordinates via Nominatim or the map pin. */
export function ListingForm({ initial, listingId }: { initial: ListingFormValues; listingId?: number }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [city, setCity] = useState<CityMeta | null>(null);
  const [amenities, setAmenities] = useState<{ id: number; label: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const set = <K extends keyof ListingFormValues>(k: K, val: ListingFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  useEffect(() => {
    fetch("/api/amenities").then((r) => r.json()).then(setAmenities).catch(() => {});
  }, []);

  const geocode = async () => {
    if (!city || v.address.trim().length < 3) return toast.info("Pick a city and enter the street address first.");
    setGeocoding(true);
    try {
      const r = await api<{ lat: number; lng: number }>(`/api/geocode?q=${encodeURIComponent(`${v.address}, ${city.name}`)}&country=${city.countryIso}`);
      setV((s) => ({ ...s, lat: r.lat, lng: r.lng }));
      toast.success("Found it — drag the pin if it's not exactly right.");
    } catch (e) {
      toast.error((e as Error).message);
      if (city.lat && city.lng) setV((s) => ({ ...s, lat: s.lat ?? city.lat, lng: s.lng ?? city.lng }));
    } finally {
      setGeocoding(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...v,
      price: Number(v.price), deposit: Number(v.deposit || 0), bedrooms: Number(v.bedrooms), bathrooms: Number(v.bathrooms),
      sizeSqm: v.sizeSqm ? Number(v.sizeSqm) : null, minStayMonths: Number(v.minStayMonths), billsEstimate: v.billsEstimate ? Number(v.billsEstimate) : null,
      capacityMin: v.isShareable ? Number(v.capacityMin) : 1, capacityMax: v.isShareable ? Number(v.capacityMax) : 1, currentOccupants: v.isShareable ? Number(v.currentOccupants) : 0,
      availableFrom: v.availableFrom || null, currency: v.currency || city?.currency || "", cityId: v.cityId ?? 0,
    };
    const parsed = listingCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) map[String(i.path[0])] ??= i.message;
      setErrors(map);
      toast.error(Object.values(map)[0] ?? "Please check the form.");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (listingId) {
        await api(`/api/listings/${listingId}`, { method: "PATCH", json: parsed.data });
        toast.success("Changes saved");
        router.refresh();
      } else {
        const r = await api<{ id: number }>("/api/listings", { method: "POST", json: parsed.data });
        toast.success("Listing created — now add photos");
        router.push(`/business/listings/${r.id}/edit#photos`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const num = (k: keyof ListingFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value.replace(/[^\d.]/g, "") as never);

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Section title="The basics">
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-muted">Type of place</div>
          <Segmented value={v.type} onChange={(t) => set("type", t)} options={TYPES.map(([value, label]) => ({ value, label }))} className="flex-wrap" />
        </div>
        <Field label="Title" error={errors.title}>{(a) => <Input {...a} maxLength={140} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Sunny private room near ETH" />}</Field>
        <Field label="Description" optional>{(a) => <Textarea {...a} rows={6} maxLength={5000} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Neighbourhood, transport, who lives there, what's included…" />}</Field>
      </Section>

      <Section title="Location">
        <LocationPicker
          initialCityId={initial.cityId}
          required
          onChange={(l) => set("cityId", l.cityId)}
          onCity={(c) => {
            setCity(c);
            if (c && !v.currency) set("currency", c.currency);
          }}
        />
        {errors.cityId && <p className="text-xs text-danger">Choose a city.</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Street address" error={errors.address} className="flex-1">{(a) => <Input {...a} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Universitätstrasse 12" />}</Field>
          <Button type="button" variant="secondary" onClick={geocode} disabled={geocoding}>{geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} Find on map</Button>
        </div>
        {(v.lat !== null || city?.lat) && (
          <div className="h-72 overflow-hidden rounded-2xl border border-line">
            <MapPanel
              height="100%"
              center={[v.lat ?? city!.lat!, v.lng ?? city!.lng!]}
              markers={v.lat !== null && v.lng !== null ? [{ id: "pin", lat: v.lat, lng: v.lng, kind: "home", label: "★" }] : []}
              draggable
              fit={false}
              onPick={(lat, lng) => setV((s) => ({ ...s, lat, lng }))}
            />
          </div>
        )}
        <p className="text-xs text-subtle">{v.lat !== null ? `Pin at ${v.lat.toFixed(5)}, ${v.lng!.toFixed(5)} — drag it to correct.` : "Use “Find on map”, or click the map to drop a pin."}</p>
      </Section>

      <Section title="Price">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monthly rent" error={errors.price}>{(a) => <Input {...a} inputMode="decimal" value={v.price} onChange={num("price")} />}</Field>
          <Field label="Deposit">{(a) => <Input {...a} inputMode="decimal" value={v.deposit} onChange={num("deposit")} />}</Field>
          <Field label="Currency" hint="Set from the country" error={errors.currency}>{(a) => <Input {...a} maxLength={3} value={v.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />}</Field>
        </div>
        <Switch label="Utilities included" description="Heating, water, electricity and internet" checked={v.utilitiesIncluded} onChange={(x) => set("utilitiesIncluded", x)} />
        {!v.utilitiesIncluded && <Field label="Estimated bills per month" optional>{(a) => <Input {...a} inputMode="decimal" value={v.billsEstimate} onChange={num("billsEstimate")} />}</Field>}
      </Section>

      <Section title="Details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bedrooms">{(a) => <Input {...a} inputMode="numeric" value={v.bedrooms} onChange={num("bedrooms")} />}</Field>
          <Field label="Bathrooms">{(a) => <Input {...a} inputMode="numeric" value={v.bathrooms} onChange={num("bathrooms")} />}</Field>
          <Field label="Size (m²)" optional>{(a) => <Input {...a} inputMode="numeric" value={v.sizeSqm} onChange={num("sizeSqm")} />}</Field>
          <Field label="Available from" optional>{(a) => <Input {...a} type="date" value={v.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} />}</Field>
          <Field label="Minimum stay (months)">{(a) => <Input {...a} inputMode="numeric" value={v.minStayMonths} onChange={num("minStayMonths")} />}</Field>
          <Field label="Who can live here">
            {(a) => (
              <Select {...a} value={v.genderPreference} onChange={(e) => set("genderPreference", e.target.value)}>
                <option value="ANYONE">Anyone</option><option value="FEMALE_ONLY">Women only</option><option value="MALE_ONLY">Men only</option>
              </Select>
            )}
          </Field>
        </div>
        <div className="card divide-y divide-line px-4">
          <div className="py-3"><Switch label="Furnished" checked={v.furnished} onChange={(x) => set("furnished", x)} /></div>
          <div className="py-3"><Switch label="Pets allowed" checked={v.petsAllowed} onChange={(x) => set("petsAllowed", x)} /></div>
          <div className="py-3"><Switch label="Smoking allowed" checked={v.smokingAllowed} onChange={(x) => set("smokingAllowed", x)} /></div>
          <div className="py-3"><Switch label="Overnight guests allowed" checked={v.guestsAllowed} onChange={(x) => set("guestsAllowed", x)} /></div>
        </div>
      </Section>

      <Section title="Sharing">
        <Switch label="People can share this place" description="Seekers can post roommate requests and you accept them one by one." checked={v.isShareable} onChange={(x) => set("isShareable", x)} />
        {v.isShareable && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min people">{(a) => <Input {...a} inputMode="numeric" value={v.capacityMin} onChange={num("capacityMin")} />}</Field>
            <Field label="Max people" error={errors.capacityMax}>{(a) => <Input {...a} inputMode="numeric" value={v.capacityMax} onChange={num("capacityMax")} />}</Field>
            <Field label="Living there now" error={errors.currentOccupants}>{(a) => <Input {...a} inputMode="numeric" value={v.currentOccupants} onChange={num("currentOccupants")} />}</Field>
          </div>
        )}
      </Section>

      <Section title="Amenities">
        <div className="flex flex-wrap gap-2">
          {amenities.map((a) => {
            const on = v.amenityIds.includes(a.id);
            return <Chip key={a.id} active={on} onClick={() => set("amenityIds", on ? v.amenityIds.filter((x) => x !== a.id) : [...v.amenityIds, a.id])}>{a.label}</Chip>;
          })}
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 flex justify-end md:bottom-4">
        <Button type="submit" size="lg" loading={saving} className="shadow-2xl">{listingId ? "Save changes" : "Create listing"}</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-5 p-6 md:p-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
