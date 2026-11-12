import { Fragment } from "react";

/**
 * Tiny, safe Markdown renderer for guide articles (## headings, - lists, **bold**,
 * *italic*, paragraphs). It builds React elements, so no HTML from the DB is ever injected.
 */
function inline(text: string, key: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={`${key}-${i}`}>{p.slice(1, -1)}</em>;
    return <Fragment key={`${key}-${i}`}>{p}</Fragment>;
  });
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="prose-nira">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (b.startsWith("## ")) return <h2 key={i}>{inline(b.slice(3), `h${i}`)}</h2>;
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ""), `l${i}-${j}`)}</li>)}</ul>;
        }
        // a heading line followed by text in the same block
        if (lines[0]?.startsWith("## ")) {
          return (
            <Fragment key={i}>
              <h2>{inline(lines[0].slice(3), `h${i}`)}</h2>
              <p>{inline(lines.slice(1).join(" "), `p${i}`)}</p>
            </Fragment>
          );
        }
        return <p key={i}>{inline(lines.join(" "), `p${i}`)}</p>;
      })}
    </div>
  );
}
