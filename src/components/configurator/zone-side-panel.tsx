"use client";

import type {
  CameraRule,
  MaterialOption,
  MeshOption,
  SelectionMap,
} from "@/types/configurator";
import { finishThumb, materialThumb } from "@/lib/configurator/chrome";
import {
  cameraKey,
  finishTypeDisplayName,
  surfaceDisplayLabel,
} from "@/lib/configurator/zone-catalog";
import { slotFromMeshId } from "@/mocks/configurator/session";

type Props = {
  cameras: CameraRule[];
  activeCameraKey: string | null;
  onSelectCamera: (camera: CameraRule) => void;
  meshes: MeshOption[];
  selectionMap: SelectionMap;
  onSelectMesh: (mesh: MeshOption) => void;
  getMaterials: (meshId: string) => MaterialOption[];
  onSelectMaterial: (meshId: string, material: MaterialOption) => void;
  onRemoveSelection?: (slot: string) => void;
  viewOnly?: boolean;
  onClose: () => void;
};

function meshSlot(mesh: MeshOption): string {
  return mesh.slot || slotFromMeshId(mesh.id);
}

export default function ZoneSidePanel({
  cameras,
  activeCameraKey,
  onSelectCamera,
  meshes,
  selectionMap,
  onSelectMesh,
  getMaterials,
  onSelectMaterial,
  onRemoveSelection,
  viewOnly,
  onClose,
}: Props) {
  const activeCamera =
    cameras.find((cam) => cameraKey(cam) === activeCameraKey) ?? null;
  const activeSlot =
    activeCamera?.slot || (meshes[0] ? meshSlot(meshes[0]) : "");
  const activeEntry = activeSlot ? selectionMap[activeSlot] : undefined;
  const activeMesh =
    meshes.find((mesh) => mesh.id === activeEntry?.meshId) ?? null;
  const variations = activeMesh ? getMaterials(activeMesh.id) : [];
  const selectedMaterial =
    variations.find((mat) => mat.id === activeEntry?.materialId) ?? null;

  return (
    <aside
      className="cfg-side-panel pointer-events-auto absolute inset-x-3 bottom-[84px] z-30 flex max-h-[min(58dvh,560px)] flex-col overflow-hidden md:inset-auto md:bottom-auto md:left-3 md:top-[62px] md:h-[min(734px,calc(100dvh-150px))] md:w-[min(347px,calc(100vw-24px))] md:max-h-none"
      aria-label="Materials"
    >
      <div className="absolute inset-0 rounded-[28px] border-[0.5px] border-white/25 bg-gradient-to-l from-[rgba(173,165,153,0.55)] to-[rgba(77,69,57,0.55)] backdrop-blur-[25px] md:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/configurator/panel-frame.svg"
        alt=""
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto hidden-scrollbar px-5 py-5 sm:gap-8 sm:px-7 sm:py-7">
        <header className="flex shrink-0 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <h2 className="min-w-0 flex-1 font-sans font-medium text-[20px] uppercase tracking-[0.6px] text-white">
              Materials
            </h2>
            <button
              type="button"
              className="relative flex size-[18px] shrink-0 items-center justify-center"
              onClick={onClose}
              aria-label="Close materials"
            >
              <span className="relative block size-[11px] overflow-clip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/configurator/close.svg"
                  alt=""
                  className="h-full w-full"
                />
              </span>
            </button>
          </div>
          <p className="font-sans text-[12px] leading-[1.2] text-white/70">
            Customize finishes for your space
          </p>
        </header>

        <section className="flex shrink-0 flex-col gap-3.5">
          <h3 className="font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white">
            Selected
          </h3>
          {selectedMaterial ? (
            <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pr-4 pl-1">
              <span className="relative size-[52px] shrink-0 overflow-clip rounded-full border border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={materialThumb(
                    selectedMaterial.id,
                    selectedMaterial.thumbnailUrl,
                  )}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <p className="min-w-0 flex-1 truncate font-sans font-medium text-[14px] leading-[1.16] text-white">
                {selectedMaterial.displayName || selectedMaterial.id}
              </p>
              {onRemoveSelection && activeSlot && !viewOnly ? (
                <button
                  type="button"
                  className="relative size-[22px] shrink-0 overflow-clip"
                  onClick={() => onRemoveSelection(activeSlot)}
                  aria-label="Clear selected material"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/configurator/clear.svg"
                    alt=""
                    className="h-full w-full"
                  />
                </button>
              ) : null}
            </div>
          ) : (
            <p className="rounded-full bg-white/5 px-4 py-3 font-sans text-[12px] text-white/60">
              No finish selected for this surface
            </p>
          )}
        </section>

        <div className="flex min-h-0 flex-1 flex-col gap-3.5">
          <section className="flex shrink-0 flex-col gap-3.5 border-b border-white/10 pb-[18px]">
            <h3 className="font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white/50">
              Surface
            </h3>
            <div className="flex flex-wrap gap-1">
              {cameras.map((cam) => {
                const key = cameraKey(cam);
                const active = activeCameraKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`h-8 min-w-[88px] flex-1 rounded-full bg-white/5 px-4 font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white ${
                      active
                        ? "border border-white/70"
                        : "border border-transparent opacity-80"
                    }`}
                    onClick={() => onSelectCamera(cam)}
                  >
                    {surfaceDisplayLabel(cam)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex shrink-0 flex-col gap-3.5 border-b border-white/10 pb-[18px]">
            <h3 className="font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white/50">
              Finish Type
            </h3>
            {viewOnly ? (
              <p className="font-sans text-[12px] text-white/55">
                View only — finishes locked
              </p>
            ) : meshes.length === 0 ? (
              <p className="font-sans text-[12px] text-white/55">
                No finish options for this surface
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {meshes.map((mesh) => {
                  const selected = activeEntry?.meshId === mesh.id;
                  return (
                    <button
                      key={mesh.id}
                      type="button"
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-[7px] rounded-full bg-white/5 py-1 pr-5 pl-1 text-left ${
                        selected ? "border border-white/70" : "border border-transparent"
                      }`}
                      onClick={() => onSelectMesh(mesh)}
                    >
                      <span className="relative size-[52px] shrink-0 overflow-clip rounded-full border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={finishThumb(mesh.id)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span
                        className={`font-sans font-medium text-[12px] leading-[1.16] text-white ${
                          selected ? "" : "opacity-80"
                        }`}
                      >
                        {finishTypeDisplayName(mesh)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3.5 pb-1">
            <h3 className="font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white/50">
              Variation
            </h3>
            {!activeMesh ? (
              <p className="font-sans text-[12px] text-white/55">
                Choose a finish type to see variations
              </p>
            ) : variations.length === 0 ? (
              <p className="font-sans text-[12px] text-white/55">
                No material variations
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {variations.map((mat) => {
                  const selected = selectedMaterial?.id === mat.id;
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      disabled={viewOnly}
                      title={mat.displayName || mat.id}
                      aria-pressed={selected}
                      className={`rounded-full p-0.5 ${
                        selected ? "border border-white" : "border border-transparent"
                      }`}
                      onClick={() => onSelectMaterial(activeMesh.id, mat)}
                    >
                      <span className="relative block size-[49px] overflow-clip rounded-full border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={materialThumb(mat.id, mat.thumbnailUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </aside>
  );
}

export { cameraKey };
