"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Listing = {
  id: number;
  title: string;
  type: string;
  address: string;
  price: number;
  currency: string;
  capacityMin: number;
  capacityMax: number;
  currentOccupants: number;
  preference: string;
  photos: string;
  city: { name: string; country: { name: string } };
};

// tilt + offset for the photos sitting behind the cover (spread out on hover)
const backStyles = [
  "-rotate-6 -translate-x-3 group-hover:-rotate-[10deg] group-hover:-translate-x-5",
  "rotate-6 translate-x-1 group-hover:rotate-[10deg] group-hover:translate-x-2",
  "-rotate-12 -translate-x-5 -translate-y-1 group-hover:-rotate-[16deg] group-hover:-translate-x-7",
];

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  // details popup (click anywhere on the card except the photos)
  const [selected, setSelected] = useState<Listing | null>(null);
  // photos-only popup (click on the photo stack)
  const [gallery, setGallery] = useState<Listing | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const fetchListings = async () => {
    const res = await fetch("/api/my-listings");
    if (res.ok) {
      const data: Listing[] = await res.json();
      setListings(data);
      // keep open popups in sync after an upload
      setSelected((prev) =>
        prev ? data.find((l) => l.id === prev.id) ?? null : null
      );
      setGallery((prev) =>
        prev ? data.find((l) => l.id === prev.id) ?? null : null
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    listingId: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;

      const res = await fetch(`/api/listings/${listingId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
      });

      if (res.ok) {
        fetchListings();
      }
    };
    reader.readAsDataURL(file);
  };

  // whichever popup opened the lightbox
  const lightboxListing = gallery ?? selected;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <p className="text-slate-400">Loading your listings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/list-a-place"
              className="bg-indigo-500 hover:bg-indigo-400 transition-colors px-5 py-2.5 rounded-full font-medium text-sm"
            >
              + Add new place
            </Link>
            <Link
              href="/chat"
              className="text-slate-400 hover:text-white transition-colors text-sm px-3"
            >
              Messages
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-slate-400 hover:text-white transition-colors text-sm px-3"
            >
              Log out
            </button>
          </div>
        </div>

        {listings.length === 0 ? (
          <p className="text-slate-400">
            You haven't published any listings yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {listings.map((listing) => {
              const photos: string[] = JSON.parse(listing.photos || "[]");
              const coverPhoto = photos[0];
              const backPhotos = photos.slice(1, 4);
              const hiddenCount = photos.length - 1;
              const occupancyPct = listing.capacityMax
                ? Math.min(
                    100,
                    Math.round(
                      (listing.currentOccupants / listing.capacityMax) * 100
                    )
                  )
                : 0;

              return (
                <div
                  key={listing.id}
                  onClick={() => {
                    setSelected(listing);
                    setLightboxIndex(null);
                  }}
                  className="group relative bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-indigo-400 transition-all cursor-pointer flex flex-col-reverse sm:flex-row sm:items-stretch justify-between gap-8"
                >
                  {/* Details, left side */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full capitalize">
                        {listing.type.replace("_", " ").toLowerCase()}
                      </span>
                      <span className="bg-slate-700/60 text-slate-300 text-xs font-medium px-3 py-1 rounded-full capitalize">
                        {listing.preference.replace("_", " ").toLowerCase()}
                      </span>
                    </div>

                    <h2 className="text-2xl font-semibold truncate">
                      {listing.title}
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      {listing.city.name}, {listing.city.country.name}
                    </p>
                    <p className="text-slate-500 text-sm mt-0.5 truncate">
                      {listing.address}
                    </p>

                    <div className="mt-auto pt-6">
                      <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-4">
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide">
                            Price
                          </p>
                          <p className="text-indigo-400 font-semibold mt-1">
                            {listing.currency} {listing.price}
                            <span className="text-slate-500 font-normal text-sm">
                              /mo
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide">
                            Capacity
                          </p>
                          <p className="font-semibold mt-1">
                            {listing.capacityMin}-{listing.capacityMax}
                            <span className="text-slate-500 font-normal text-sm">
                              {" "}
                              people
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide">
                            Occupied
                          </p>
                          <p className="font-semibold mt-1">
                            {listing.currentOccupants}/{listing.capacityMax}
                          </p>
                          <div className="h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full"
                              style={{ width: `${occupancyPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo stack + add button, right side */}
                  <div className="flex flex-col items-center gap-4 flex-shrink-0 self-center sm:self-start">
                    {/* Clicking the stack opens ONLY the photos popup */}
                    <div
                      onClick={(e) => {
                        if (photos.length === 0) return;
                        e.stopPropagation();
                        setGallery(listing);
                        setLightboxIndex(null);
                      }}
                      className={`relative w-40 h-40 mx-3 ${
                        photos.length > 0 ? "cursor-zoom-in" : ""
                      }`}
                    >
                      {[...backPhotos].reverse().map((photo, revIdx) => {
                        const i = backPhotos.length - 1 - revIdx;
                        return (
                          <img
                            key={i}
                            src={photo}
                            alt=""
                            style={{ zIndex: 5 - i }}
                            className={`absolute inset-0 w-40 h-40 object-cover rounded-lg border border-slate-700 shadow-md transition-transform duration-300 ${backStyles[i]}`}
                          />
                        );
                      })}

                      {coverPhoto ? (
                        <div className="absolute inset-0 z-10">
                          <img
                            src={coverPhoto}
                            alt={listing.title}
                            className="w-40 h-40 object-cover rounded-lg shadow-lg bg-slate-900"
                          />
                          {hiddenCount > 0 && (
                            <span className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-xs font-medium px-2 py-0.5 rounded-full border border-slate-600">
                              +{hiddenCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 w-40 h-40 rounded-lg bg-slate-900 flex items-center justify-center text-slate-600 text-xs z-10">
                          No photo
                        </div>
                      )}
                    </div>

                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="bg-indigo-500 hover:bg-indigo-400 transition-colors px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer"
                    >
                      + Add photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, listing.id)}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photos-only popup */}
      {gallery && (() => {
        const allPhotos: string[] = JSON.parse(gallery.photos || "[]");
        return (
          <div
            onClick={() => setGallery(null)}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-300 text-sm">
                  {gallery.title} · {allPhotos.length} photo
                  {allPhotos.length === 1 ? "" : "s"}
                </p>
                <button
                  onClick={() => setGallery(null)}
                  className="text-slate-400 hover:text-white text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allPhotos.map((photo, i) => (
                  <div key={i} className="relative">
                    <img
                      src={photo}
                      alt={`Photo ${i + 1}`}
                      onClick={() => {
                        setLightboxIndex(i);
                        setZoomed(false);
                      }}
                      className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 bg-slate-950/80 text-white text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-600">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Details popup */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto"
          >
            {(() => {
              const allPhotos: string[] = JSON.parse(selected.photos || "[]");
              return allPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {allPhotos.map((photo, i) => (
                    <div key={i} className="relative">
                      <img
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        onClick={() => {
                          setLightboxIndex(i);
                          setZoomed(false);
                        }}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-slate-950/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-slate-600">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            <h2 className="text-2xl font-bold mb-2">{selected.title}</h2>
            <p className="text-slate-400 mb-4">
              {selected.address}, {selected.city.name},{" "}
              {selected.city.country.name}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-slate-500">Type</p>
                <p>{selected.type}</p>
              </div>
              <div>
                <p className="text-slate-500">Price</p>
                <p>
                  {selected.currency} {selected.price}/mo
                </p>
              </div>
              <div>
                <p className="text-slate-500">Capacity</p>
                <p>
                  {selected.capacityMin}-{selected.capacityMax} people
                </p>
              </div>
              <div>
                <p className="text-slate-500">Currently occupied</p>
                <p>{selected.currentOccupants}</p>
              </div>
              <div>
                <p className="text-slate-500">Preference</p>
                <p>{selected.preference.replace("_", " ")}</p>
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg py-2.5 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen photo lightbox */}
      {lightboxListing && lightboxIndex !== null && (() => {
        const allPhotos: string[] = JSON.parse(lightboxListing.photos || "[]");
        const isFirst = lightboxIndex === 0;
        const isLast = lightboxIndex === allPhotos.length - 1;

        const goPrev = () => {
          if (isFirst) return;
          setZoomed(false);
          setLightboxIndex(lightboxIndex - 1);
        };
        const goNext = () => {
          if (isLast) return;
          setZoomed(false);
          setLightboxIndex(lightboxIndex + 1);
        };

        return (
          <div
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[60] px-4"
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-white text-2xl hover:text-slate-300"
            >
              ✕
            </button>

            <img
              src={allPhotos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setZoomed(!zoomed);
              }}
              className={`transition-transform duration-300 cursor-zoom-in rounded-lg ${
                zoomed
                  ? "max-w-none max-h-none scale-150 cursor-zoom-out"
                  : "max-w-full max-h-[75vh] object-contain"
              }`}
            />

            {allPhotos.length > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-6 mt-6"
              >
                <button
                  onClick={goPrev}
                  disabled={isFirst}
                  className="bg-slate-800 hover:bg-slate-700 transition-colors text-white px-5 py-2.5 rounded-full font-medium disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
                >
                  ← Previous
                </button>
                <span className="text-slate-400 text-sm">
                  {lightboxIndex + 1} / {allPhotos.length}
                </span>
                <button
                  onClick={goNext}
                  disabled={isLast}
                  className="bg-slate-800 hover:bg-slate-700 transition-colors text-white px-5 py-2.5 rounded-full font-medium disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </main>
  );
}