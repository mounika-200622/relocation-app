/**
 * Prints the address phones should use to reach this laptop's Nira server:
 *   npm run address
 * Type it into the app's "can't connect" screen (or a phone browser) after changing networks.
 */
import { networkInterfaces } from "node:os";

const PORT = process.env.PORT || "3000";
const isPrivate = (ip) => /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

const found = [];
for (const [name, addrs] of Object.entries(networkInterfaces())) {
  for (const a of addrs ?? []) {
    if (a.family !== "IPv4" || a.internal || !isPrivate(a.address)) continue;
    if (/virtual|vEthernet|vbox|docker|wsl/i.test(name) || a.address.startsWith("192.168.56.")) continue;
    found.push({ name, address: a.address });
  }
}
if (!found.length) {
  console.log("Not connected to a network. Join Wi-Fi (or the phone's hotspot) and run this again.");
} else {
  for (const f of found) console.log(`${f.address}:${PORT}    (${f.name})   →  http://${f.address}:${PORT}`);
}
