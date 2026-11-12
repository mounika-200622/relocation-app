import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not generate AGENTS.md / CLAUDE.md into the repo on `next dev`.
  agentRules: false,
};

export default nextConfig;
