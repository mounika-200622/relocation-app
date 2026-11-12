import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Photo storage abstraction.
 *  - Cloudinary (free tier) when CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET are set.
 *  - Otherwise files go to /public/uploads (fine for development, not for serverless hosting).
 */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS = 10;
export type ImageKind = "jpg" | "png" | "webp";

/** Detects the real type from the file's magic bytes (never trust the extension or MIME). */
export function sniffImage(buf: Uint8Array): ImageKind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length >= 12 && String.fromCharCode(...buf.slice(0, 4)) === "RIFF" && String.fromCharCode(...buf.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export type Stored = { url: string; storageKey: string };

function cloudinary() {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  return cloud && key && secret ? { cloud, key, secret } : null;
}

function sign(params: Record<string, string>, secret: string) {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(base + secret).digest("hex");
}

export async function savePhoto(buf: Buffer, kind: ImageKind, folder: string): Promise<Stored> {
  const c = cloudinary();
  if (c) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params = { folder: `nira/${folder}`, timestamp };
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(buf)], { type: `image/${kind === "jpg" ? "jpeg" : kind}` }));
    form.set("api_key", c.key);
    form.set("timestamp", timestamp);
    form.set("folder", params.folder);
    form.set("signature", sign(params, c.secret));
    const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);
    const data = (await res.json()) as { secure_url: string; public_id: string };
    return { url: data.secure_url, storageKey: `cloudinary:${data.public_id}` };
  }
  const name = `${randomUUID()}.${kind}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return { url: `/uploads/${folder}/${name}`, storageKey: `local:${folder}/${name}` };
}

export async function deletePhoto(storageKey: string) {
  try {
    if (storageKey.startsWith("cloudinary:")) {
      const c = cloudinary();
      if (!c) return;
      const public_id = storageKey.slice("cloudinary:".length);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const form = new FormData();
      form.set("public_id", public_id);
      form.set("api_key", c.key);
      form.set("timestamp", timestamp);
      form.set("signature", sign({ public_id, timestamp }, c.secret));
      await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/destroy`, { method: "POST", body: form });
    } else if (storageKey.startsWith("local:")) {
      const rel = storageKey.slice("local:".length);
      if (rel.includes("..")) return; // never leave the uploads folder
      await fs.unlink(path.join(process.cwd(), "public", "uploads", rel));
    }
    // "sample:" keys point at bundled demo art and are never deleted
  } catch (err) {
    console.warn("[storage] delete failed", storageKey, (err as Error).message);
  }
}
