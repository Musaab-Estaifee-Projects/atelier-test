// src/components/configurator/configurator-dock.tsx
"use client";

import type { ResolutionOption } from "@/lib/stream-pixel/types";
import { RESOLUTION_OPTIONS } from "@/lib/stream-pixel/types";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

type Props = {
  saveStatus: SaveStatus;
  selectionsOpen: boolean;
  onToggleSelections: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  currentResolution: string;
  onChangeResolution: (option: ResolutionOption) => void;
  resolutionEnabled?: boolean;
  viewOnly?: boolean;
  selectionCount: number;
  levels?: string[];
  activeLevel?: string;
  onLoadLevel?: (levelName: string) => void;
  onFinalDesign?: () => void;
  finalDesignDisabled?: boolean;
};

function saveLabel(status: SaveStatus, viewOnly?: boolean): string {
  if (viewOnly) return "View only";
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "unsaved":
      return "Not saved";
    default:
      return "Saved";
  }
}

export default function ConfiguratorDock({
  saveStatus,
  selectionsOpen,
  onToggleSelections,
  onReset,
  onFullscreen,
  settingsOpen,
  onToggleSettings,
  currentResolution,
  onChangeResolution,
  resolutionEnabled = true,
  viewOnly,
  selectionCount,
  levels = [],
  activeLevel,
  onLoadLevel,
  onFinalDesign,
  finalDesignDisabled,
}: Props) {
  return (
    <div className="cfg-dock-wrap">
      <div className="cfg-dock" role="toolbar" aria-label="Configurator tools">
        {onFinalDesign ? (
          <button
            type="button"
            className="cfg-dock-btn cfg-dock-btn-final"
            onClick={onFinalDesign}
            disabled={finalDesignDisabled}
            title="Prepare high-resolution room renders"
          >
            Final design
          </button>
        ) : null}

        <button
          type="button"
          className={`cfg-dock-btn${selectionsOpen ? " is-active" : ""}`}
          onClick={onToggleSelections}
          title="Show selections"
        >
          Selections
          {selectionCount > 0 ? (
            <span className="cfg-dock-badge">{selectionCount}</span>
          ) : null}
        </button>

        <button
          type="button"
          className="cfg-dock-btn"
          onClick={onReset}
          disabled={viewOnly}
          title="Reset to defaults"
        >
          Reset
        </button>

        <button
          type="button"
          className={`cfg-dock-btn cfg-dock-status is-${saveStatus}`}
          disabled
          title={saveLabel(saveStatus, viewOnly)}
        >
          {saveLabel(saveStatus, viewOnly)}
        </button>

        <button
          type="button"
          className="cfg-dock-btn"
          onClick={onFullscreen}
          title="Fullscreen"
        >
          Fullscreen
        </button>

        <div className="cfg-dock-settings">
          <button
            type="button"
            className={`cfg-dock-btn${settingsOpen ? " is-active" : ""}`}
            onClick={onToggleSettings}
            title="Stream settings"
          >
            Settings
          </button>
          {settingsOpen && (
            <div className="cfg-settings-pop">
              {levels.length > 0 && onLoadLevel && (
                <>
                  <p className="cfg-settings-title">Floor plan</p>
                  {levels.map((levelName) => (
                    <button
                      key={levelName}
                      type="button"
                      className={`cfg-settings-opt${
                        activeLevel === levelName ? " is-active" : ""
                      }`}
                      disabled={viewOnly}
                      onClick={() => onLoadLevel(levelName)}
                    >
                      {levelName}
                    </button>
                  ))}
                  <div className="cfg-settings-divider" />
                </>
              )}
              <p className="cfg-settings-title">Stream resolution</p>
              {!resolutionEnabled && (
                <p className="cfg-muted">Resolution locked by stream</p>
              )}
              {RESOLUTION_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={`cfg-settings-opt${
                    currentResolution === option.label ? " is-active" : ""
                  }`}
                  disabled={!resolutionEnabled && option.width != null}
                  onClick={() => onChangeResolution(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
