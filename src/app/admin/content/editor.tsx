"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/client";
import type { EntityDef } from "@/lib/admin-entities";
import { cn } from "@/lib/cn";

type Row = Record<string, unknown> & { id: number };
type Country = { id: number; name: string; isoCode: string };

/** Generic table editor driven by the entity registry (create / edit / delete). */
export function ContentEditor({ entities, def }: { entities: { key: string; label: string }[]; def: EntityDef }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState<string>("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const hasCountry = def.fields.some((f) => f.type === "country");

  const load = useCallback(() => {
    setRows(null);
    api<{ rows: Row[] }>(`/api/admin/content/${def.key}${countryId ? `?countryId=${countryId}` : ""}`).then((r) => setRows(r.rows)).catch((e) => toast.error((e as Error).message));
  }, [def.key, countryId]);

  useEffect(load, [load]);
  useEffect(() => {
    fetch("/api/locations?level=countries").then((r) => r.json()).then((cs: Country[]) => {
      setCountries(cs);
      setCountryId((c) => c || String(cs.find((x) => x.isoCode === "CH")?.id ?? ""));
    });
  }, []);

  const open = (row: Row | "new") => {
    setEditing(row);
    setForm(row === "new" ? { countryId: countryId ? Number(countryId) : "" } : { ...row });
  };

  const save = async () => {
    setSaving(true);
    const payload = Object.fromEntries(def.fields.map((f) => [f.name, form[f.name] === undefined ? "" : form[f.name]]));
    try {
      if (editing === "new") await api(`/api/admin/content/${def.key}`, { method: "POST", json: payload });
      else if (editing) await api(`/api/admin/content/${def.key}/${editing.id}`, { method: "PATCH", json: payload });
      toast.success("Saved");
      setEditing(null);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${String(row[def.titleField])}"?`)) return;
    try {
      await api(`/api/admin/content/${def.key}/${row.id}`, { method: "DELETE" });
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const countryName = (id: unknown) => countries.find((c) => c.id === id)?.name ?? id;
  const columns = def.fields.filter((f) => f.type !== "textarea").slice(0, 5);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Content types">
        {entities.map((e) => <Link key={e.key} href={`/admin/content?type=${e.key}`} className={cn("shrink-0 rounded-xl px-3 py-2 text-sm", e.key === def.key ? "bg-fg text-bg" : "text-muted hover:bg-soft")}>{e.label}</Link>)}
      </nav>
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">{def.label}</h2>
          {hasCountry && (
            <Select aria-label="Country" value={countryId} onChange={(e) => setCountryId(e.target.value)} className="h-10 w-56">
              <option value="">All countries</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
          <Button onClick={() => open("new")}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle"><tr>{columns.map((c) => <th key={c.name} className="px-4 py-3">{c.label}</th>)}<th className="px-4" /></tr></thead>
            <tbody className="divide-y divide-line">
              {rows === null ? (
                <tr><td colSpan={columns.length + 1} className="p-4"><div className="skeleton h-24" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="p-6 text-center text-muted">No rows yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c.name} className="max-w-[220px] truncate px-4 py-2.5">{c.type === "country" ? String(countryName(r[c.name])) : c.type === "bool" ? (r[c.name] ? "Yes" : "No") : String(r[c.name] ?? "—")}</td>)}
                  <td className="px-4 text-right">
                    <button onClick={() => open(r)} className="rounded-lg p-1.5 text-muted hover:bg-soft" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(r)} className="rounded-lg p-1.5 text-danger hover:bg-soft" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? `New ${def.label.toLowerCase()}` : `Edit ${def.label.toLowerCase()}`} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          {def.fields.map((f) => {
            const val = form[f.name];
            const set = (v: unknown) => setForm((s) => ({ ...s, [f.name]: v }));
            if (f.type === "bool") return <div key={f.name} className="sm:col-span-2"><Switch label={f.label} checked={Boolean(val)} onChange={set} /></div>;
            return (
              <Field key={f.name} label={f.label + (f.required ? " *" : "")} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                {(a) =>
                  f.type === "textarea" ? <Textarea {...a} rows={f.name === "body" ? 12 : 3} value={String(val ?? "")} onChange={(e) => set(e.target.value)} />
                  : f.type === "select" ? <Select {...a} value={String(val ?? "")} onChange={(e) => set(e.target.value)}><option value="">—</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</Select>
                  : f.type === "country" ? <Select {...a} value={String(val ?? "")} onChange={(e) => set(Number(e.target.value))}><option value="">—</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
                  : <Input {...a} inputMode={f.type === "text" ? undefined : "decimal"} value={String(val ?? "")} onChange={(e) => set(e.target.value)} />
                }
              </Field>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
