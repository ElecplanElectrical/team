"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";
import { cleanClientName, exactClientMatches, suggestedClients, type ClientNameOption } from "@/lib/client-name";

type Props = {
  clients: ClientNameOption[];
  name: string;
  selectedId: string;
  disabled?: boolean;
  onChange: (name: string, selectedId: string) => void;
};

export default function ClientNameInput({ clients, name, selectedId, disabled = false, onChange }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = suggestedClients(clients, name);
  const options = matches.slice(0, 8);
  const exact = exactClientMatches(clients, name);
  const showOptions = open && !disabled && options.length > 0;
  const helper = selectedId || exact.length === 1
    ? "Existing client - no duplicate will be created."
    : exact.length > 1
      ? "Several clients have this name. Select the correct record."
      : cleanClientName(name)
        ? "New client - saved when you create the job. Check the matches first."
        : "Type a name to find a client or add a new one here.";

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  function select(client: ClientNameOption) {
    onChange(client.name, client.id);
    input.current?.focus();
    setOpen(false);
    setActive(-1);
  }

  return <div ref={root} className="flex min-w-0 flex-col gap-1.5" onBlur={(event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    <label htmlFor={id} className="text-xs font-medium" style={{ color: UI.mute }}>Client</label>
    <div className="relative">
      <input ref={input} id={id} value={name} disabled={disabled} maxLength={160}
        placeholder="Search or type a new client" autoComplete="off" autoCorrect="off" spellCheck={false}
        role="combobox" aria-autocomplete="list" aria-expanded={showOptions}
        aria-controls={showOptions ? `${id}-options` : undefined}
        aria-activedescendant={showOptions && active >= 0 && active < options.length ? `${id}-option-${active}` : undefined}
        aria-describedby={`${id}-help`}
        onFocus={() => { setOpen(true); setActive(-1); }}
        onChange={(event) => { onChange(event.target.value, ""); setOpen(true); setActive(-1); }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options.length) {
            event.preventDefault(); setOpen(true);
            setActive((current) => event.key === "ArrowDown" ? (current + 1) % options.length
              : (current <= 0 ? options.length - 1 : current - 1));
          } else if (event.key === "Enter" && showOptions && active >= 0 && options[active]) {
            event.preventDefault(); select(options[active]);
          } else if (event.key === "Escape") {
            event.preventDefault(); setOpen(false); setActive(-1);
          }
        }}
        className="h-12 w-full rounded-lg py-2 pl-3 pr-11 text-base outline-none focus:ring-2 focus:ring-cyan-400/60 md:h-11 md:text-sm"
        style={{ boxShadow: "var(--ep-inset-shadow)", background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text }} />
      {name && <button type="button" aria-label="Clear client" disabled={disabled}
        onClick={() => { onChange("", ""); input.current?.focus(); setOpen(true); setActive(-1); }}
        className="absolute right-0 top-0 flex h-full w-11 items-center justify-center" style={{ color: UI.mute }}><X size={16} /></button>}
    </div>
    {showOptions && <div className="overflow-hidden rounded-lg" style={{ background: UI.panelAlt, border: `1px solid ${UI.border}` }}>
      <div className="px-3 pt-2 text-[11px]" style={{ color: UI.faint }}>Existing clients</div>
      <ul id={`${id}-options`} role="listbox" aria-label="Matching clients" className="max-h-48 overflow-y-auto overscroll-contain py-1">
        {options.map((client, index) => <li key={client.id} role="none">
          <button id={`${id}-option-${index}`} type="button" role="option" aria-selected={selectedId === client.id}
            onMouseDown={(event) => event.preventDefault()} onClick={() => select(client)}
            className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-base md:text-sm"
            style={{ color: UI.text, background: active === index ? "rgba(67,210,255,.14)" : "transparent" }}>
            <span className="min-w-0 break-words">{client.name}
              {exactClientMatches(clients, client.name).length > 1 && <small className="block text-[11px]" style={{ color: UI.faint }}>Client record {client.id.slice(-6)}</small>}
            </span>
            {selectedId === client.id && <Check size={16} className="shrink-0" style={{ color: UI.cyan }} />}
          </button>
        </li>)}
      </ul>
      {matches.length > options.length && <p className="px-3 pb-2 text-[11px]" style={{ color: UI.faint }}>Keep typing to narrow the matches.</p>}
    </div>}
    <p id={`${id}-help`} className="text-[11px]" style={{ color: UI.faint }}>{helper}</p>
  </div>;
}
