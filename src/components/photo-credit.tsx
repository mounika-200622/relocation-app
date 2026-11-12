import { cn } from "@/lib/cn";

/** Parses "Author · Licence · Commons file title" into parts plus the Commons link. */
export function parseCredit(credit: string | null | undefined) {
  if (!credit) return null;
  const [author, license, title] = credit.split(" · ");
  if (!author || !license) return null;
  return { author, license, title: title ?? "", url: title ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title.replace(/ /g, "_"))}` : null };
}

/** Small attribution line required by CC licences (author, licence, link to the source). */
export function PhotoCredit({ credit, className, light }: { credit: string | null | undefined; className?: string; light?: boolean }) {
  const c = parseCredit(credit);
  if (!c) return null;
  return (
    <span className={cn("text-[10.5px] leading-tight", light ? "text-white/75" : "text-subtle", className)}>
      Photo: {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{c.author}</a> : c.author} · {c.license} · Wikimedia Commons
    </span>
  );
}
