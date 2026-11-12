"use client";

import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export type Position = { lat: number; lng: number; accuracy: number };

export class PositionError extends Error {
  constructor(message: string, public denied = false) {
    super(message);
  }
}

/**
 * Current position. Inside the Android app this uses the native GPS plugin (and asks for
 * the Android location permission); in a browser it uses the standard Geolocation API.
 */
export async function getPosition(): Promise<Position> {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== "granted") {
        const asked = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
        if (asked.location !== "granted" && asked.coarseLocation !== "granted") throw new PositionError("Location permission was not given.", true);
      }
    } else if (!("geolocation" in navigator)) {
      throw new PositionError("This browser can't share your location.");
    }
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60_000 });
    return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
  } catch (err) {
    if (err instanceof PositionError) throw err;
    const msg = (err as Error).message ?? "";
    if (/denied|permission/i.test(msg)) throw new PositionError("Location permission was not given.", true);
    if (/secure|insecure/i.test(msg)) throw new PositionError("Location needs a secure connection (https or the Nira app).");
    throw new PositionError("Couldn't get your location. Is location turned on?");
  }
}

const KEY = "nira-location-ok";
/** Remembers that the user once shared their location, so we can refresh it silently. */
export const rememberLocationConsent = () => {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable: just ask again next time */
  }
};
export const hasLocationConsent = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
