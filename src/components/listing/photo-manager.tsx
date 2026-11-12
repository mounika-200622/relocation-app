"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";

type Photo = { id: number; url: string; position: number; caption: string | null };
const MAX = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Upload (jpg/png/webp ≤ 5 MB, ≤ 10), reorder, set cover, caption and delete photos. */
export function PhotoManager({ listingId, initial }: { listingId: number; initial: Photo[] }) {
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    const bad = list.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad) return toast.error(`"${bad.name}" must be a JPG, PNG or WebP under 5 MB.`);
    if (photos.length + list.length > MAX) return toast.error(`You can have at most ${MAX} photos.`);
    const form = new FormData();
    list.forEach((f) => form.append("files", f));
    setBusy(true);
    try {
      const r = await api<{ photos: Photo[] }>(`/api/listings/${listingId}/photos`, { method: "POST", body: form });
      setPhotos(r.photos);
      toast.success(`${list.length} photo${list.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const patch = async (json: object) => {
    try {
      const r = await api<{ photos: Photo[] }>(`/api/listings/${listingId}/photos`, { method: "PATCH", json });
      setPhotos(r.photos);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const order = photos.map((p) => p.id);
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    patch({ order });
  };

  const remove = async (id: number) => {
    try {
      const r = await api<{ photos: Photo[] }>(`/api/listings/${listingId}/photos?photoId=${id}`, { method: "DELETE" });
      setPhotos(r.photos);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <section id="photos" className="card scroll-mt-24 space-y-5 p-6 md:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Photos</h2>
          <p className="text-sm text-muted">{photos.length}/{MAX} · the first photo is the cover</p>
        </div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy || photos.length >= MAX} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-strong px-4 text-sm font-medium text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Add photos
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>
      {photos.length === 0 ? (
        <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }} className="grid h-48 w-full place-items-center rounded-2xl border-2 border-dashed border-line-strong text-sm text-muted hover:border-accent hover:text-fg">
          Drop photos here or click to choose (JPG, PNG, WebP · max 5 MB each)
        </button>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className={cn("overflow-hidden rounded-2xl border bg-soft", i === 0 ? "border-accent ring-4 ring-accent/10" : "border-line")}>
              <div className="relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption ?? `Photo ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-accent-strong px-2.5 py-1 text-[11px] font-semibold text-white">Cover</span>}
              </div>
              <div className="space-y-2 p-3">
                <input
                  defaultValue={p.caption ?? ""}
                  maxLength={140}
                  placeholder="Caption (optional)"
                  aria-label={`Caption for photo ${i + 1}`}
                  onBlur={(e) => e.target.value !== (p.caption ?? "") && patch({ captions: { [p.id]: e.target.value } })}
                  className="h-9 w-full rounded-lg border border-line bg-elev px-2.5 text-sm outline-none focus:border-accent/60"
                />
                <div className="flex items-center gap-1">
                  <IconBtn label="Move left" onClick={() => move(i, -1)} disabled={i === 0}><ArrowLeft className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Move right" onClick={() => move(i, 1)} disabled={i === photos.length - 1}><ArrowRight className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Make cover" onClick={() => patch({ coverId: p.id })} disabled={i === 0}><Star className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Delete photo" onClick={() => remove(p.id)} danger><Trash2 className="h-4 w-4" /></IconBtn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={cn("grid h-8 w-8 place-items-center rounded-lg hover:bg-hover disabled:opacity-30", danger ? "ml-auto text-danger" : "text-muted")}>
      {children}
    </button>
  );
}
