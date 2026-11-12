import type { MetadataRoute } from "next";

/** Web app manifest: makes Nira installable on Android/iOS home screens. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nira — get settled anywhere",
    short_name: "Nira",
    description: "Housing, roommates, nearby essentials, a settling-in guide and budget trip plans.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0810",
    theme_color: "#0e0810",
    categories: ["travel", "lifestyle", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Find a place", url: "/relocate" },
      { name: "Messages", url: "/chat" },
      { name: "Plan a trip", url: "/trip/new" },
    ],
  };
}
