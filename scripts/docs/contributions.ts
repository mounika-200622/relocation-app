/**
 * Writes docs/contributions.md from the git history: commits per member, split by area
 * (database vs. application vs. docs/tests), so individual contribution is verifiable.
 *
 *   npx tsx scripts/docs/contributions.ts
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

type Commit = { author: string; subject: string; files: string[] };

const raw = execFileSync("git", ["log", "--no-merges", "--name-only", "--format=@@%an|%s"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const commits: Commit[] = raw
  .split("@@")
  .filter(Boolean)
  .map((block) => {
    const [head, ...files] = block.trim().split("\n");
    const [author, subject] = head!.split("|");
    return { author: author!, subject: subject ?? "", files: files.filter(Boolean) };
  });

function area(c: Commit) {
  const f = c.files.join(" ");
  if (/prisma\/(schema|migrations)/.test(f) || /^feat\(db\)/.test(c.subject)) return "Database schema & SQL objects";
  if (/prisma\/seed/.test(f)) return "Seed data";
  if (/docs\/|README/.test(f) || c.subject.startsWith("docs")) return "Documentation";
  if (/tests\//.test(f) || c.subject.startsWith("test")) return "Tests";
  if (/src\/(lib|app\/api)/.test(f) && !/src\/app\/(?!api)/.test(f)) return "Backend (API & domain logic)";
  if (/src\/(app|components)/.test(f)) return "Frontend (pages & UI)";
  if (/android|capacitor|mobile\//.test(f)) return "Android / PWA";
  return "Tooling & setup";
}

const authors = [...new Set(commits.map((c) => c.author))];
const areas = [...new Set(commits.map(area))].sort();
const count = (a: string, ar?: string) => commits.filter((c) => c.author === a && (!ar || area(c) === ar)).length;

let md = `# Individual contributions\n\nGenerated from \`git log\` (${commits.length} commits, merges excluded).\n\n`;
md += `| Area | ${authors.join(" | ")} |\n|---|${authors.map(() => "---").join("|")}|\n`;
for (const ar of areas) md += `| ${ar} | ${authors.map((a) => count(a, ar)).join(" | ")} |\n`;
md += `| **Total** | ${authors.map((a) => `**${count(a)}**`).join(" | ")} |\n\n`;
for (const a of authors) {
  md += `## ${a}\n\n`;
  for (const c of commits.filter((x) => x.author === a).slice(0, 400).reverse()) md += `- ${c.subject}\n`;
  md += "\n";
}
fs.writeFileSync("docs/contributions.md", md);
console.log(`wrote docs/contributions.md (${commits.length} commits)`);
