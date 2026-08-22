// src/components/configurator/selections-sheet.tsx
"use client";

import type { SelectionEntry } from "@/types/configurator";

type Props = {
  open: boolean;
  selections: SelectionEntry[];
  slotLabels?: Record<string, string>;
  price?: number;
  onClose: () => void;
  onSubmit?: () => void;
  onRemove?: (slot: string) => void;
  viewOnly?: boolean;
};

export default function SelectionsSheet({
  open,
  selections,
  slotLabels = {},
  price,
  onClose,
  onSubmit,
  onRemove,
  viewOnly,
}: Props) {
  if (!open) return null;

  return (
    <div className="cfg-sheet" role="dialog" aria-label="Current selections">
      <header className="cfg-sheet-header">
        <h2>Selections</h2>
        <button type="button" className="cfg-icon-btn" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="cfg-sheet-body">
        {selections.length === 0 ? (
          <p className="cfg-muted">No finishes selected yet.</p>
        ) : (
          <ul className="cfg-sheet-list">
            {selections.map((s) => (
              <li key={s.slot} className="cfg-sheet-item">
                <div className="cfg-sheet-item-main">
                  <strong>{slotLabels[s.slot] ?? s.slot}</strong>
                  <span>
                    {s.meshId}
                    {s.materialId ? ` · ${s.materialId}` : " · mesh only"}
                  </span>
                </div>
                {!viewOnly && onRemove && (
                  <button
                    type="button"
                    className="cfg-sheet-remove"
                    aria-label={`Remove ${slotLabels[s.slot] ?? s.slot}`}
                    onClick={() => onRemove(s.slot)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="cfg-sheet-footer">
        {typeof price === "number" && (
          <p className="cfg-sheet-price">
            Est. AED {price.toLocaleString()}
          </p>
        )}
        {!viewOnly && onSubmit && (
          <button type="button" className="cfg-primary-btn" onClick={onSubmit}>
            Submit design
          </button>
        )}
      </footer>
    </div>
  );
}
