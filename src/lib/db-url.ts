/**
 * On Windows "localhost" resolves to IPv6 ::1 first, while a default MySQL install listens on
 * IPv4 only. Connections then fail intermittently with P1001 "Can't reach database server".
 * Pinning the loopback host to 127.0.0.1 removes that whole class of random failures, even
 * for an older .env that still says localhost.
 */
export function ipv4Loopback(url: string | undefined) {
  return url
    ?.replace(/@localhost(?=[:/?]|$)/, "@127.0.0.1")
    .replace(/^(mongodb(?:\+srv)?:\/\/)localhost(?=[:/?,]|$)/, "$1127.0.0.1");
}

/**
 * Prisma gives up on a new MySQL connection after 5 s (connect_timeout) and on waiting for a
 * free pooled connection after 10 s (pool_timeout). On a busy laptop (a build, the embedding
 * model and the dev server at once) the handshake can take longer, which showed up as random
 * P1001 errors. Longer defaults are added unless the URL sets its own.
 */
export function mysqlUrl(url: string | undefined) {
  const u = ipv4Loopback(url);
  if (!u || !u.startsWith("mysql://")) return u;
  const defaults: Record<string, string> = { connect_timeout: "30", pool_timeout: "30" };
  const [base, query = ""] = u.split("?", 2) as [string, string?];
  const params = new URLSearchParams(query);
  for (const [k, v] of Object.entries(defaults)) if (!params.has(k)) params.set(k, v);
  return `${base}?${params}`;
}
