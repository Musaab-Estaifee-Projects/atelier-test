"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  stats: Record<string, string | number> | null;
};

/**
 * Stream stats from UIControl.getStreamStats().
 * Optional debug surface for production monitoring.
 */
export default function StatsPanel({ open, onClose, stats }: Props) {
  if (!open) return null;

  return (
    <div className="stats-popup">
      <div className="stats-popup-header">
        <span className="stats-popup-title">Stream Info</span>
        <button
          type="button"
          className="stats-popup-close"
          onClick={onClose}
          aria-label="Close stats"
        >
          &times;
        </button>
      </div>
      <div className="stats-popup-body">
        {stats && Object.keys(stats).length > 0 ? (
          Object.entries(stats).map(([key, val]) => (
            <div className="stats-row" key={key}>
              <span className="stats-label">{key}</span>
              <span className="stats-value">{String(val)}</span>
            </div>
          ))
        ) : (
          <p className="stats-empty">Waiting for stream statistics...</p>
        )}
      </div>
    </div>
  );
}
