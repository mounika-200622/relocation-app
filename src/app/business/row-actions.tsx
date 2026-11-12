"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, MoreHorizontal, Pencil, RotateCcw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ListingRowActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const setStatus = async (s: "ACTIVE" | "RENTED" | "ARCHIVED") => {
    try {
      const r = await api<{ closedRequests?: number }>(`/api/listings/${id}/status`, { method: "POST", json: { status: s } });
      toast.success(s === "RENTED" ? `Marked as rented${r.closedRequests ? ` · closed ${r.closedRequests} open request(s)` : ""}` : s === "ARCHIVED" ? "Archived" : "Listing is live again");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-muted hover:bg-soft hover:text-fg" aria-label="Listing actions"><MoreHorizontal className="h-5 w-5" /></button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 card p-1.5">
          <Item href={`/business/listings/${id}/edit`} icon={<Pencil className="h-4 w-4" />}>Edit & photos</Item>
          <Item href={`/business/listings/${id}/requests`} icon={<Users className="h-4 w-4" />}>Roommate requests</Item>
          {status !== "RENTED" && <Btn onClick={() => setStatus("RENTED")} icon={<CheckCircle2 className="h-4 w-4" />}>Mark as rented</Btn>}
          {status !== "ACTIVE" && <Btn onClick={() => setStatus("ACTIVE")} icon={<RotateCcw className="h-4 w-4" />}>Make active</Btn>}
          {status !== "ARCHIVED" && <Btn onClick={() => setStatus("ARCHIVED")} icon={<Archive className="h-4 w-4" />}>Archive</Btn>}
          <Btn onClick={() => { setOpen(false); setConfirmDelete(true); }} icon={<Trash2 className="h-4 w-4" />} danger>Delete</Btn>
        </div>
      )}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this listing?">
        <p className="text-sm text-muted">Photos, saves, views and roommate requests for this place are deleted too. Conversations stay so people can finish talking. This can&apos;t be undone — archive it instead if you might list it again.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await api(`/api/listings/${id}`, { method: "DELETE" });
                toast.success("Listing deleted");
                setConfirmDelete(false);
                router.refresh();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Item({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-soft hover:text-fg">{icon}{children}</Link>;
}
function Btn({ onClick, icon, children, danger }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-soft ${danger ? "text-danger" : "text-muted hover:text-fg"}`}>{icon}{children}</button>;
}
