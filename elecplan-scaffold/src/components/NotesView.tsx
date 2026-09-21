"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FilePlus2, List, Plus, Save, Search, Table2, Trash2, Type, X } from "lucide-react";
import TopBar from "@/components/TopBar";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

type TextBlock = { id: string; type: "text"; text: string };
type BulletBlock = { id: string; type: "bullets"; items: string[] };
type TableBlock = { id: string; type: "table"; rows: string[][] };
type Block = TextBlock | BulletBlock | TableBlock;
type Note = { id: string; title: string; content: unknown; createdAt: string; updatedAt: string };

function id() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function normalise(value: unknown): Block[] {
  if (!Array.isArray(value)) return [{ id: id(), type: "text", text: "" }];
  const blocks = value.flatMap((raw): Block[] => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const blockId = typeof item.id === "string" ? item.id : id();
    if (item.type === "text") return [{ id: blockId, type: "text", text: typeof item.text === "string" ? item.text : "" }];
    if (item.type === "bullets") return [{ id: blockId, type: "bullets", items: Array.isArray(item.items) ? item.items.map(v => typeof v === "string" ? v : "") : [""] }];
    if (item.type === "table") return [{ id: blockId, type: "table", rows: Array.isArray(item.rows) ? item.rows.map(row => Array.isArray(row) ? row.map(cell => typeof cell === "string" ? cell : "") : []) : [["", ""], ["", ""]] }];
    return [];
  });
  return blocks.length ? blocks : [{ id: id(), type: "text", text: "" }];
}

export default function NotesView({ notes: initialNotes }: { notes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes.map(note => ({ ...note, content: normalise(note.content) })));
  const [selectedId, setSelectedId] = useState(initialNotes[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = notes.find(note => note.id === selectedId) ?? notes[0] ?? null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(note => note.title.toLowerCase().includes(q));
  }, [notes, query]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  function queueSave(note: typeof notes[number]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(note), 700);
  }

  function patchSelected(changes: Partial<{ title: string; content: Block[] }>) {
    if (!selected) return;
    const next = { ...selected, ...changes };
    setNotes(current => current.map(note => note.id === selected.id ? next : note));
    queueSave(next);
  }

  async function save(note: typeof notes[number]) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: note.title, content: note.content }),
      });
      if (!response.ok) throw new Error("Could not save note");
      const body = await response.json();
      setNotes(current => current.map(item => item.id === note.id ? { ...item, updatedAt: body.updatedAt } : item));
      setSavedAt(new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save note");
    } finally {
      setSaving(false);
    }
  }

  async function createNote() {
    setError(null);
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Note" }),
    });
    if (!response.ok) {
      setError("Could not create note");
      return;
    }
    const body = await response.json();
    const note = { ...body, content: normalise(body.content) };
    setNotes(current => [note, ...current]);
    setSelectedId(note.id);
  }

  async function deleteNote() {
    if (!selected || !window.confirm(`Delete “${selected.title}”?`)) return;
    const response = await fetch(`/api/notes/${selected.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not delete note");
      return;
    }
    setNotes(current => current.filter(note => note.id !== selected.id));
    setSelectedId(notes.find(note => note.id !== selected.id)?.id ?? "");
  }

  function addBlock(type: Block["type"]) {
    if (!selected) return;
    const block: Block = type === "text"
      ? { id: id(), type: "text", text: "" }
      : type === "bullets"
        ? { id: id(), type: "bullets", items: [""] }
        : { id: id(), type: "table", rows: [["", ""], ["", ""]] };
    patchSelected({ content: [...selected.content, block] });
  }

  return <>
    <TopBar
      title="Notes"
      subtitle="Apple Notes style workspace"
      rightSlot={<button type="button" onClick={() => void createNote()} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ ...UI.primary, color: UI.activeText }}><FilePlus2 size={16}/> New note</button>}
    />
    <div className="flex min-h-0 flex-1 overflow-hidden" style={{ background: "var(--ep-main)" }}>
      <aside className="hidden w-[310px] shrink-0 border-r md:flex md:flex-col" style={{ borderColor: UI.borderSoft, background: "rgba(15,20,26,.82)" }}>
        <div className="p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes" className="h-10 w-full rounded-xl pl-9 pr-3 text-sm outline-none" style={{ background: "var(--ep-input)", border: `1px solid ${UI.borderSoft}`, color: UI.text, boxShadow: "var(--ep-inset-shadow)" }}/>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
          {filtered.map(note => <button
            type="button"
            key={note.id}
            onClick={() => setSelectedId(note.id)}
            className="mb-1 w-full rounded-xl px-3 py-3 text-left transition"
            style={selected?.id === note.id ? { background: "rgba(67,210,255,.13)", border: "1px solid rgba(67,210,255,.28)" } : { border: "1px solid transparent" }}
          >
            <p className="truncate text-sm font-semibold" style={{ color: UI.text }}>{note.title || "Untitled Note"}</p>
            <p className="mt-1 text-[11px]" style={{ color: UI.faint }}>{new Date(note.updatedAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
          </button>)}
          {!filtered.length && <p className="px-3 py-8 text-center text-xs" style={{ color: UI.faint }}>No notes found.</p>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
        {selected ? <div className="mx-auto w-full max-w-5xl">
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <select value={selected.id} onChange={e => setSelectedId(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg px-3 text-sm" style={{ background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text }}>
              {notes.map(note => <option key={note.id} value={note.id}>{note.title}</option>)}
            </select>
            <button type="button" onClick={() => void createNote()} className="h-10 rounded-lg px-3" style={{ ...UI.primary, color: UI.activeText }}><Plus size={16}/></button>
          </div>

          <section className="overflow-hidden rounded-2xl" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:px-4" style={{ borderColor: UI.borderSoft, background: "rgba(67,210,255,.035)" }}>
              <button type="button" onClick={() => addBlock("text")} className="tool"><Type size={15}/> Text</button>
              <button type="button" onClick={() => addBlock("bullets")} className="tool"><List size={15}/> Bullets</button>
              <button type="button" onClick={() => addBlock("table")} className="tool"><Table2 size={15}/> Table</button>
              <span className="ml-auto text-[11px]" style={{ color: error ? UI.red : UI.faint }}>{error ?? (saving ? "Saving…" : savedAt ? `Saved ${savedAt}` : "Autosaves")}</span>
              <button type="button" onClick={() => void save(selected)} className="tool"><Save size={15}/><span className="hidden sm:inline">Save</span></button>
              <button type="button" onClick={() => void deleteNote()} className="tool" style={{ color: UI.red }}><Trash2 size={15}/></button>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <input
                value={selected.title}
                onChange={e => patchSelected({ title: e.target.value })}
                placeholder="Title"
                className="mb-6 w-full bg-transparent text-3xl font-bold tracking-tight outline-none sm:text-4xl"
                style={{ color: UI.text }}
              />

              <div className="space-y-4">
                {selected.content.map((block, blockIndex) => <BlockEditor
                  key={block.id}
                  block={block}
                  onChange={next => patchSelected({ content: selected.content.map((item, i) => i === blockIndex ? next : item) })}
                  onDelete={() => patchSelected({ content: selected.content.length === 1 ? [{ id: id(), type: "text", text: "" }] : selected.content.filter((_, i) => i !== blockIndex) })}
                />)}
              </div>
            </div>
          </section>
        </div> : <div className="flex h-full min-h-[420px] items-center justify-center"><button onClick={() => void createNote()} className="rounded-xl px-5 py-3 font-semibold" style={{ ...UI.primary, color: UI.activeText }}><Plus size={16} className="mr-2 inline"/>Create your first note</button></div>}
      </main>
    </div>
    <style jsx global>{`
      .tool{display:inline-flex;height:36px;align-items:center;gap:7px;border-radius:9px;padding:0 10px;font-size:12px;font-weight:700;color:#c5cdd7;background:rgba(255,255,255,.035);border:1px solid rgba(67,210,255,.14)}
      .tool:hover{background:rgba(67,210,255,.09);color:#f4f7fa}
    `}</style>
  </>;
}

function BlockEditor({ block, onChange, onDelete }: { block: Block; onChange: (block: Block) => void; onDelete: () => void }) {
  if (block.type === "text") return <div className="group relative">
    <textarea
      value={block.text}
      onChange={e => onChange({ ...block, text: e.target.value })}
      onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.max(90, el.scrollHeight)}px`; }}
      placeholder="Start writing…"
      className="min-h-[90px] w-full resize-none rounded-xl bg-transparent p-3 text-[15px] leading-7 outline-none"
      style={{ color: UI.text, border: `1px solid ${UI.borderSoft}` }}
    />
    <RemoveButton onClick={onDelete}/>
  </div>;

  if (block.type === "bullets") return <div className="group relative rounded-xl p-3" style={{ border: `1px solid ${UI.borderSoft}` }}>
    <div className="space-y-2">
      {block.items.map((item, index) => <div key={index} className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: UI.cyan }}/>
        <input
          value={item}
          onChange={e => onChange({ ...block, items: block.items.map((v, i) => i === index ? e.target.value : v) })}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              const next = [...block.items];
              next.splice(index + 1, 0, "");
              onChange({ ...block, items: next });
            }
          }}
          placeholder="List item"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
          style={{ color: UI.text }}
        />
        {block.items.length > 1 && <button type="button" onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== index) })} style={{ color: UI.faint }}><X size={14}/></button>}
      </div>)}
    </div>
    <button type="button" onClick={() => onChange({ ...block, items: [...block.items, ""] })} className="mt-2 flex items-center gap-1 text-xs" style={{ color: UI.cyan }}><Plus size={13}/>Add point</button>
    <RemoveButton onClick={onDelete}/>
  </div>;

  return <div className="group relative overflow-x-auto rounded-xl p-3" style={{ border: `1px solid ${UI.borderSoft}` }}>
    <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-lg">
      <tbody>
        {block.rows.map((row, rowIndex) => <tr key={rowIndex}>
          {row.map((cell, colIndex) => <td key={colIndex} className="border p-0" style={{ borderColor: UI.borderSoft }}>
            <input
              value={cell}
              onChange={e => onChange({ ...block, rows: block.rows.map((r, ri) => ri === rowIndex ? r.map((c, ci) => ci === colIndex ? e.target.value : c) : r) })}
              className="h-10 min-w-[150px] w-full bg-transparent px-2 text-sm outline-none"
              style={{ color: UI.text }}
            />
          </td>)}
        </tr>)}
      </tbody>
    </table>
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" className="tool" onClick={() => onChange({ ...block, rows: [...block.rows, Array.from({ length: block.rows[0]?.length || 2 }, () => "")] })}><Plus size={13}/>Row</button>
      <button type="button" className="tool" onClick={() => onChange({ ...block, rows: block.rows.map(row => [...row, ""]) })}><Plus size={13}/>Column</button>
      {block.rows.length > 1 && <button type="button" className="tool" onClick={() => onChange({ ...block, rows: block.rows.slice(0, -1) })}>Remove row</button>}
      {(block.rows[0]?.length || 0) > 1 && <button type="button" className="tool" onClick={() => onChange({ ...block, rows: block.rows.map(row => row.slice(0, -1)) })}>Remove column</button>}
    </div>
    <RemoveButton onClick={onDelete}/>
  </div>;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label="Remove block" className="absolute -right-2 -top-2 hidden h-7 w-7 items-center justify-center rounded-full group-hover:flex" style={{ background: "#1a2028", border: `1px solid ${UI.borderSoft}`, color: UI.red }}><X size={13}/></button>;
}
