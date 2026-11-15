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
