import { matchLabel } from "@/lib/matching";

/** Circular 0-100 compatibility indicator. */
export function ScoreRing({ score, size = 52, showLabel }: { score: number; size?: number; showLabel?: boolean }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "var(--success)" : score >= 60 ? "var(--accent)" : score >= 40 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="flex items-center gap-2" title={`${matchLabel(score)} (${score}%)`}>
      <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${score}% compatible`}>
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
          <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
        </svg>
        <span className="text-[11px] font-bold tabular-nums">{score}%</span>
      </div>
      {showLabel && <span className="text-xs font-medium text-muted">{matchLabel(score)}</span>}
    </div>
  );
}
