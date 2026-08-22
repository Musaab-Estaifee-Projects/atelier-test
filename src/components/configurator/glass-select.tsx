// src/components/configurator/glass-select.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";

export type GlassSelectOption = {
  id: string;
  label: string;
};

type Props = {
  value: string;
  options: GlassSelectOption[];
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

/**
 * Custom select matching configurator glass panels (blur + translucent).
 * Native <select> cannot style the options list reliably.
 */
export default function GlassSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className={`cfg-glass-select${open ? " is-open" : ""}${selected ? " has-value" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="cfg-glass-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cfg-glass-select-value">
          {selected?.label || placeholder}
        </span>
        <span className="cfg-glass-select-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <ul
          id={listId}
          className="cfg-glass-select-menu"
          role="listbox"
        >
          {options.map((o) => {
            const active = o.id === value;
            return (
              <li key={o.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`cfg-glass-select-option${active ? " is-active" : ""}`}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
