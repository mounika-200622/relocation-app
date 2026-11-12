import { redirect } from "next/navigation";

/** v1 URL kept working. */
export default function ListAPlaceRedirect() {
  redirect("/business/listings/new");
}
