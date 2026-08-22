// src/components/configurator/zone-top-bar.tsx
"use client";

import { CONFIGURATOR_ZONES } from "@/lib/configurator/zone-catalog";

type Props = {
  activeZoneId: string | null;
  freeCameraActive: boolean;
  onSelectZone: (zoneId: string) => void;
  onFreeCamera: () => void;
  disabled?: boolean;
};

export default function ZoneTopBar({
  activeZoneId,
  freeCameraActive,
  onSelectZone,
  onFreeCamera,
  disabled,
}: Props) {
  return (
    <nav className="cfg-zone-bar" aria-label="Apartment zones">
      <ul className="cfg-zone-bar-list">
        {CONFIGURATOR_ZONES.map((z) => {
          const active = !freeCameraActive && activeZoneId === z.id;
          return (
            <li key={z.id}>
              <button
                type="button"
                className={`cfg-zone-chip${active ? " is-active" : ""}`}
                disabled={disabled}
                onClick={() => onSelectZone(z.id)}
              >
                {z.label}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className={`cfg-zone-chip cfg-zone-chip-free${freeCameraActive ? " is-active" : ""}`}
            disabled={disabled}
            onClick={onFreeCamera}
            title="Exit fixed camera — free roam"
          >
            Free camera
          </button>
        </li>
      </ul>
    </nav>
  );
}
