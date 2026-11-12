import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);

/** PNG app icons for the PWA manifest and Android (rendered once, then cached). */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e1b4b, #08090d)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", color: "#eef0f7", fontSize: size * 0.6, fontStyle: "italic", fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>
          N<span style={{ color: "#8b8ef8" }}>.</span>
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } },
  );
}
