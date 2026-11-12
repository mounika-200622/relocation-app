import { redirect } from "next/navigation";

/** v1 URL kept working: the owner's listings now live on the business dashboard. */
export default function MyListingsRedirect() {
  redirect("/business");
}
