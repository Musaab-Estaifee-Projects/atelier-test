"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  ConfiguratorSession,
  RoomRenderCard,
  SelectionEntry,
} from "@/types/configurator";
import { reviewGroups } from "@/lib/configurator/final-design";

type Props = {
  open: boolean;
  rooms: RoomRenderCard[];
  session: ConfiguratorSession;
  selections: SelectionEntry[];
  currency?: string;
  onBack: () => void;
  onQuote: () => void;
};

export default function FinalDesignReview({
  open,
  rooms,
  session,
  selections,
  currency = "AED",
  onBack,
  onQuote,
}: Props) {
  const groups = useMemo(
    () => reviewGroups(session, selections),
    [session, selections],
  );
  const withStills = rooms.filter((r) => r.imageUrl);
  const [activeId, setActiveId] = useState<string | null>(
    withStills[0]?.zoneId ?? groups.rooms[0]?.zoneId ?? null,
  );

  if (!open) return null;

  const activeRoom =
    withStills.find((r) => r.zoneId === activeId) ?? withStills[0] ?? null;
  const activeGroup =
    groups.rooms.find((g) => g.zoneId === activeRoom?.zoneId) ??
    groups.rooms[0];

  return (
    <div className="fd-overlay" role="dialog" aria-modal="true" aria-labelledby="fd-review-title">
      <div className="fd-modal fd-modal-review">
        <h2 id="fd-review-title" className="fd-review-title">
          Review your design &amp; materials
        </h2>

        <div className="fd-review-grid">
          <nav className="fd-review-nav" aria-label="Render preview">
            <p className="fd-col-label">Render Preview</p>
            <ul>
              {withStills.map((room) => (
                <li key={room.zoneId}>
                  <button
                    type="button"
                    className={`fd-nav-item${
                      room.zoneId === activeRoom?.zoneId ? " is-active" : ""
                    }`}
                    onClick={() => setActiveId(room.zoneId)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={room.imageUrl} alt="" className="fd-nav-thumb" />
                    <span>{room.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="fd-review-stage">
            {activeRoom?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeRoom.imageUrl}
                alt={activeRoom.label}
                className="fd-review-img"
              />
            ) : (
              <div className="fd-thumb fd-thumb-empty" />
            )}
          </div>

          <aside className="fd-review-mats">
            <p className="fd-col-label">Selected materials</p>
            <h3>{activeGroup?.label ?? activeRoom?.label ?? "Room"}</h3>
            {activeGroup?.lines.length ? (
              <ul className="fd-mat-list">
                {activeGroup.lines.map((line) => (
                  <li key={line.slot}>
                    <div className="fd-mat-main">
                      {line.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.thumbnailUrl} alt="" className="fd-mat-swatch" />
                      ) : (
                        <span className="fd-mat-swatch fd-mat-swatch-empty" />
                      )}
                      <div>
                        <p className="fd-mat-slot">{line.slotLabel}</p>
                        <p className="fd-mat-name">{line.materialName}</p>
                      </div>
                    </div>
                    <span className="fd-mat-price">
                      {line.price.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fd-muted">No finishes selected in this room.</p>
            )}
            {activeGroup ? (
              <p className="fd-subtotal">
                {activeGroup.label} subtotal{" "}
                <strong>
                  {currency} {activeGroup.subtotal.toLocaleString()}
                </strong>
              </p>
            ) : null}
            <p className="fd-total">
              Estimated Total{" "}
              <strong>
                {currency} {groups.total.toLocaleString()}
              </strong>
            </p>
          </aside>
        </div>

        <div className="fd-actions fd-actions-end">
          <Button type="button" variant="pill-outline" size="pill" onClick={onBack}>
            Back to customize
          </Button>
          <Button type="button" variant="pill-solid" size="pill" onClick={onQuote}>
            Request quote
          </Button>
        </div>
      </div>
    </div>
  );
}
