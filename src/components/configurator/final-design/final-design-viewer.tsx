"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoomRenderCard } from "@/types/configurator";

type Props = {
  room: RoomRenderCard | null;
  onClose: () => void;
};

export default function FinalDesignViewer({ room, onClose }: Props) {
  const stills = (room?.stills ?? []).filter((s) => s.imageUrl);
  const [index, setIndex] = useState(0);

  if (!room?.imageUrl) return null;

  const src =
    stills[index]?.imageUrl ??
    stills.find((s) => s.cameraName === room.heroCameraName)?.imageUrl ??
    room.imageUrl;

  const label = stills[index]
    ? `${room.label} · ${stills[index].cameraName.replace(/^CAM-/, "")}`
    : room.label;

  return (
    <div className="fd-viewer" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className="fd-viewer-backdrop" onClick={onClose} />
      <div className="fd-viewer-panel">
        <header className="fd-viewer-head">
          <p>{label}</p>
          <button type="button" className="fd-icon-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="fd-viewer-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="fd-viewer-img" />
        </div>
        {stills.length > 1 ? (
          <div className="fd-viewer-nav">
            <Button
              type="button"
              variant="pill-outline"
              size="pill"
              onClick={() => setIndex((i) => (i - 1 + stills.length) % stills.length)}
            >
              Previous
            </Button>
            <span>
              {index + 1} / {stills.length}
            </span>
            <Button
              type="button"
              variant="pill-outline"
              size="pill"
              onClick={() => setIndex((i) => (i + 1) % stills.length)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
