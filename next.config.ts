import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not generate AGENTS.md / CLAUDE.md into the repo on `next dev`.
  agentRules: false,
  // Let phones/emulators on the LAN load dev assets (Android emulator = 10.0.2.2).
  // Add your laptop's IP with NIRA_DEV_ORIGINS="192.168.2.100" (comma-separated).
  allowedDevOrigins: ["10.0.2.2", ...(process.env.NIRA_DEV_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)],
};

export default nextConfig;
