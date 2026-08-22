"use client";

import type { RoomRenderCard } from "@/types/configurator";

type Props = {
  open: boolean;
  rooms: RoomRenderCard[];
  completedCount: number;
  progressPct: number;
  allReady: boolean;
  error?: string | null;
  onBack: () => void;
  onReview: () => void;
  onView: (zoneId: string) => void;
  onRetry: (zoneId: string) => void;
};

function StatusBadge({ room }: { room: RoomRenderCard }) {
  if (room.status === "completed" && room.imageUrl) {
    return (
      <span className="fd-badge fd-badge-done">
        <span aria-hidden>✓</span> Completed
      </span>
    );
  }
  if (room.status === "error") {
    return (
      <span className="fd-badge fd-badge-error">
        <span aria-hidden>!</span> Failed
      </span>
    );
  }
  if (room.status === "rendering") {
    return (
      <span className="fd-badge fd-badge-busy">
        <span className="fd-spinner" aria-hidden /> Rendering
      </span>
    );
  }
  return (
    <span className="fd-badge fd-badge-queued">
      <span aria-hidden>○</span> Queued
    </span>
  );
}

function statusCopy(room: RoomRenderCard): string {
  if (room.status === "completed" && room.imageUrl) {
    return "Your final render is ready.";
  }
  if (room.status === "error") {
    return room.error ?? "Capture failed. You can retry this room.";
  }
  if (room.status === "rendering") return "Preparing your final view…";
  return "Waiting to render…";
}

export default function FinalDesignProgress({
  open,
  rooms,
  completedCount,
  progressPct,
  allReady,
  error,
  onBack,
  onReview,
  onView,
  onRetry,
}: Props) {
  if (!open) return null;

  return (
    <div className="fd-overlay" role="dialog" aria-modal="true" aria-labelledby="fd-progress-title">
      <div className="fd-modal fd-modal-progress">
        <header className="fd-progress-head">
          <h2 id="fd-progress-title">Preparing your final design</h2>
          <p className="fd-progress-meta">
            <span>
              {completedCount} of {rooms.length} Rooms are ready…
            </span>
            <span>{progressPct}% Complete</span>
          </p>
        </header>

        {error ? <p className="fd-error">{error}</p> : null}

        <ul className="fd-room-grid">
          {rooms.map((room) => {
            const ready = Boolean(room.imageUrl);
            return (
              <li key={room.zoneId} className="fd-room-card">
                <div className="fd-thumb-wrap">
                  {room.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.imageUrl}
                      alt={`${room.label} render`}
                      className="fd-thumb"
                    />
                  ) : (
                    <div className="fd-thumb fd-thumb-empty" aria-hidden />
                  )}
                </div>
                <div className="fd-room-card-body">
                  <div className="fd-room-card-title">
                    <h3>{room.label}</h3>
                    <StatusBadge room={room} />
                  </div>
                  <p className="fd-room-card-copy">{statusCopy(room)}</p>
                  {room.status === "error" ? (
                    <button
                      type="button"
                      className="fd-view-btn"
                      onClick={() => onRetry(room.zoneId)}
                    >
                      Retry
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="fd-view-btn"
                      disabled={!ready}
                      onClick={() => onView(room.zoneId)}
                    >
                      View
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="fd-progress-hint">
          You can review your complete design once all rooms are ready.
          Failed rooms can be retried without restarting the whole job.
        </p>
        <div className="fd-actions">
          <button type="button" className="fd-btn fd-btn-ghost" onClick={onBack}>
            Back to customize
          </button>
          <button
            type="button"
            className="fd-btn fd-btn-solid"
            disabled={!allReady}
            onClick={onReview}
          >
            Review design &amp; prices
          </button>
        </div>
      </div>
    </div>
  );
}
