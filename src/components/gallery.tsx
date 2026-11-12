"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";

type Photo = { id: number; url: string; caption: string | null };

/** Mosaic (1 large + 4 small) with a full-screen, keyboard-driven lightbox. */
export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);
  const move = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, move]);

  if (!photos.length) return <div className="grid aspect-[16/7] place-items-center rounded-3xl bg-soft text-subtle">No photos yet</div>;
  const rest = photos.slice(1, 5);

  return (
    <>
      <div className="relative grid gap-2 overflow-hidden rounded-3xl md:grid-cols-4 md:grid-rows-2 md:aspect-[16/7]">
        <button onClick={() => setIndex(0)} className="relative aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto" aria-label="Open photo 1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]!.url} alt={photos[0]!.caption ?? title} className="h-full w-full object-cover transition hover:brightness-90" />
        </button>
        {rest.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i + 1)}
            // with fewer than 4 small photos, stretch them so the mosaic has no empty cells
            className={`relative hidden md:block ${rest.length === 1 ? "md:col-span-2 md:row-span-2" : rest.length === 2 ? "md:row-span-2" : rest.length === 3 && i === 2 ? "md:col-span-2" : ""}`}
            aria-label={`Open photo ${i + 2}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? `${title} photo ${i + 2}`} className="h-full w-full object-cover transition hover:brightness-90" />
          </button>
        ))}
        {photos.length > 1 && (
          <button onClick={() => setIndex(0)} className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-black shadow">
            <Grid2x2 className="h-4 w-4" /> Show all {photos.length} photos
          </button>
        )}
      </div>

      {index !== null && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[90] flex flex-col bg-black/95 text-white animate-fade-up">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm opacity-80">{index + 1} / {photos.length}</span>
            <button onClick={close} className="rounded-full p-2 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[index]!.url} alt={photos[index]!.caption ?? title} className="max-h-full max-w-full rounded-xl object-contain" />
            {photos.length > 1 && (
              <>
                <button onClick={() => move(-1)} className="absolute left-4 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="Previous photo"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => move(1)} className="absolute right-4 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label="Next photo"><ChevronRight className="h-5 w-5" /></button>
              </>
            )}
          </div>
          {photos[index]!.caption && <p className="pb-6 text-center text-sm opacity-80">{photos[index]!.caption}</p>}
        </div>
      )}
    </>
  );
}
