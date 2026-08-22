"use client";

type Props = {
  loadId: string;
  onLoadIdChange: (value: string) => void;
  onLoad: () => void;
  onSave: () => void;
  loadPending?: boolean;
  savePending?: boolean;
  loadError?: string | null;
  saveError?: string | null;
  /** Disable while any other UE action is in flight */
  blocked?: boolean;
};

/**
 * Save / Load customization.
 *
 * Production flow (when backend is ready):
 * 1. Save → UE SaveCustomization → backend stores JSON → returns Design Code
 * 2. Design Code is written to the URL (?designCode=...)
 * 3. Share link restores the same look via LoadCustomization
 */
export default function SaveLoadPanel({
  loadId,
  onLoadIdChange,
  onLoad,
  onSave,
  loadPending = false,
  savePending = false,
  loadError = null,
  saveError = null,
  blocked = false,
}: Props) {
  return (
    <div className="customization-save-panel">
      <label className="customization-load-label" htmlFor="load-id">
        Design Code / Load ID
      </label>
      <div className="customization-load-row">
        <input
          id="load-id"
          type="text"
          className="customization-load-input"
          placeholder="Enter saved Design Code"
          value={loadId}
          disabled={loadPending || blocked}
          onChange={(e) => onLoadIdChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onLoad();
          }}
        />
        <button
          type="button"
          className="customization-load-btn"
          disabled={loadPending || savePending || blocked}
          onClick={onLoad}
        >
          {loadPending ? "Loading…" : "Load"}
        </button>
      </div>
      {loadError && (
        <p className="camera-zone-error">Load failed: {loadError}</p>
      )}

      <button
        type="button"
        className="customization-save-btn"
        disabled={savePending || loadPending || blocked}
        onClick={onSave}
      >
        {savePending ? "Saving…" : "Save customization"}
      </button>
      {saveError && (
        <p className="camera-zone-error">Save failed: {saveError}</p>
      )}
    </div>
  );
}
