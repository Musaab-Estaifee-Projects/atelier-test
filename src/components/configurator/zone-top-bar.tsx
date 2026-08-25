"use client";

import AtelierLogo from "@/components/icons/atelier-logo";
import ReefWord from "@/components/icons/reef-word";
import type { CameraRule } from "@/types/configurator";
import {
  CONFIGURATOR_ZONES,
  cameraKey,
  surfaceDisplayLabel,
  zoneDisplayLabel,
} from "@/lib/configurator/zone-catalog";

type Props = {
  activeZoneId: string | null;
  freeCameraActive: boolean;
  onSelectZone: (zoneId: string) => void;
  cameras: CameraRule[];
  activeCameraKey: string | null;
  onSelectCamera: (camera: CameraRule) => void;
  disabled?: boolean;
};

const glassPill =
  "pointer-events-auto flex max-w-[calc(100vw-24px)] items-center rounded-full border-[0.5px] border-white/25 bg-gradient-to-l from-[rgba(173,165,153,0.5)] to-[rgba(77,69,57,0.5)] p-1 backdrop-blur-[25px]";

const chip =
  "h-8 shrink-0 rounded-full px-[13px] font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white whitespace-nowrap transition hover:bg-white/10 disabled:opacity-40";

export default function ZoneTopBar({
  activeZoneId,
  freeCameraActive,
  onSelectZone,
  cameras,
  activeCameraKey,
  onSelectCamera,
  disabled,
}: Props) {
  const zoneSelected = Boolean(activeZoneId) && !freeCameraActive;
  const showSurfaces = zoneSelected && cameras.length > 0;

  return (
    <div className="cfg-zone-bar pointer-events-none absolute inset-x-0 top-0 z-[28] flex flex-col items-center gap-1.5 px-3 pt-[max(10px,env(safe-area-inset-top))] sm:gap-2 sm:pt-[max(14px,env(safe-area-inset-top))]">
      <div className="flex flex-col items-center">
        <AtelierLogo className="h-[22px] w-auto sm:h-[28px]" />
        <ReefWord className="mt-1 h-[9px] w-auto sm:mt-1.5 sm:h-[11px]" />
      </div>

      <nav className={glassPill} aria-label="Apartment zones">
        <ul className="m-0 flex list-none items-center overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CONFIGURATOR_ZONES.map((z) => {
            const active = zoneSelected && activeZoneId === z.id;
            return (
              <li key={z.id}>
                <button
                  type="button"
                  className={`${chip}${active ? " bg-white/10" : " opacity-80"}`}
                  disabled={disabled}
                  onClick={() => onSelectZone(z.id)}
                >
                  {zoneDisplayLabel(z.id)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {showSurfaces ? (
        <nav className={glassPill} aria-label="Room surfaces">
          <ul className="m-0 flex list-none items-center overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cameras.map((cam) => {
              const key = cameraKey(cam);
              const active = activeCameraKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`${chip}${active ? " bg-white/10" : " opacity-80"}`}
                    disabled={disabled}
                    onClick={() => onSelectCamera(cam)}
                  >
                    {surfaceDisplayLabel(cam)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
