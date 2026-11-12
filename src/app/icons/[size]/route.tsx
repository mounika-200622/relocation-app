import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);
const BG = "linear-gradient(135deg, #831843, #0e0810)";

/**
 * PNG app art rendered on demand and cached:
 *   /icons/192, /icons/512      – PWA + Android launcher icons
 *   /icons/512?fg=1             – transparent foreground layer for Android adaptive icons
 *   /icons/splash               – 1080×1920 Android splash screen
 */
export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const raw = (await params).size;
  const headers = { "Cache-Control": "public, max-age=604800, immutable" };

  if (raw === "splash") {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0e0810" }}>
          <div style={{ display: "flex", color: "#eef0f7", fontSize: 220, fontStyle: "italic", fontWeight: 700, fontFamily: "serif" }}>
            Nira<span style={{ color: "#fda4af" }}>.</span>
          </div>
          <div style={{ marginTop: 24, color: "#a1a9bc", fontSize: 44 }}>Wherever you&apos;re headed.</div>
        </div>
      ),
      { width: 1080, height: 1920, headers },
    );
  }

  const size = Number(raw);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const foreground = new URL(req.url).searchParams.get("fg") === "1";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: foreground ? "transparent" : BG }}>
        {/* adaptive-icon foregrounds must keep the glyph inside the central 66% safe zone */}
        <div style={{ display: "flex", alignItems: "flex-end", color: "#eef0f7", fontSize: size * (foreground ? 0.4 : 0.6), fontStyle: "italic", fontWeight: 700, fontFamily: "serif", lineHeight: 1 }}>
          N<span style={{ color: "#fda4af" }}>.</span>
        </div>
      </div>
    ),
    { width: size, height: size, headers },
  );
}
