"use client";

import {
  RESOLUTION_OPTIONS,
  type ResolutionOption,
} from "@/lib/stream-pixel/types";

type Props = {
  open: boolean;
  onClose: () => void;
  currentResolution: string;
  onChangeResolution: (option: ResolutionOption) => void;
  enabled?: boolean;
};

/**
 * Streaming quality panel.
 * Meeting notes: Settings is provided by Pixel Streaming (not custom-designed).
 * We only surface resolution when the dashboard enables it.
 */
export default function SettingsPanel({
  open,
  onClose,
  currentResolution,
  onChangeResolution,
  enabled = true,
}: Props) {
  if (!open || !enabled) return null;

  return (
    <div className="settings-popup">
      <div className="stats-popup-header">
        <span className="stats-popup-title">Quality</span>
        <button
          type="button"
          className="stats-popup-close"
          onClick={onClose}
          aria-label="Close settings"
        >
          &times;
        </button>
      </div>
      <div className="settings-popup-body">
        {RESOLUTION_OPTIONS.map((option: ResolutionOption) => (
          <button
            key={option.label}
            type="button"
            className={`settings-option ${
              currentResolution === option.label ? "settings-option-active" : ""
            }`}
            onClick={() => onChangeResolution(option)}
          >
            <span>{option.label}</span>
            {currentResolution === option.label && <span aria-hidden>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
