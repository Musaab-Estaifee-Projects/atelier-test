"use client";

type Props = {
  levels: string[];
  activeLevel: string;
  onLoadLevel: (levelName: string) => void;
  pending?: boolean;
  error?: string | null;
};

/**
 * Floor-plan / UE level switcher.
 * Level names must match what the client's Unreal build expects (e.g. 2BHK_Type_2_Updated).
 */
export default function LevelPicker({
  levels,
  activeLevel,
  onLoadLevel,
  pending = false,
  error = null,
}: Props) {
  return (
    <div className="level-picker-panel" data-testid="level-picker-panel">
      <p className="level-picker-title">Floor plan</p>
      <div className="level-picker-list">
        {levels.map((levelName) => (
          <button
            key={levelName}
            type="button"
            disabled={pending}
            className={`camera-zone-btn level-picker-btn ${
              activeLevel === levelName ? "camera-zone-btn-active" : ""
            }`}
            onClick={() => onLoadLevel(levelName)}
          >
            <span className="camera-zone-name">{levelName}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="camera-zone-error">Level change failed: {error}</p>
      )}
    </div>
  );
}
