import fs from "node:fs/promises";
import path from "node:path";

/**
 * Serves photos uploaded at runtime (public/uploads). `next start` only serves the public/
 * files that existed at build time, so new uploads would 404 without this route. In dev the
 * static file is served first and this route is not reached.
 */
const ROOT = path.join(process.cwd(), "public", "uploads");
const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const file = path.resolve(ROOT, ...parts);
  const type = TYPES[path.extname(file).toLowerCase()];
  // never leave the uploads folder, and only serve image files
  if (!type || !file.startsWith(ROOT + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const body = await fs.readFile(file);
    return new Response(new Uint8Array(body), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
