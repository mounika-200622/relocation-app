import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { themeScript } from "@/components/theme";
import { Navbar } from "@/components/nav/navbar";
import { MobileTabBar } from "@/components/nav/mobile-tab-bar";
import { auth } from "@/lib/auth";
import { ServiceWorkerRegister } from "@/components/sw-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], style: ["italic", "normal"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: { default: "Nira — Wherever you're headed, Nira gets you settled", template: "%s · Nira" },
  description:
    "Find housing and roommates, discover nearby essentials, follow a step-by-step settling-in guide and plan budget trips — for anyone moving abroad or travelling.",
  applicationName: "Nira",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Nira", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/192" },
  openGraph: { title: "Nira", description: "Wherever you're headed, Nira gets you settled.", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0810" },
    { media: "(prefers-color-scheme: light)", color: "#fff6fa" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // hydrate the client session from the server so the navbar never flashes logged-out
  const session = await auth();
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${playfair.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers session={session}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-accent-strong focus:px-4 focus:py-2 focus:text-white">
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
          <MobileTabBar />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
