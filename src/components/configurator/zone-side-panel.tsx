"use client";

import type {
  CameraRule,
  MaterialOption,
  MeshOption,
  SelectionEntry,
  SelectionMap,
} from "@/types/configurator";
import CatalogThumb from "./catalog-thumb";
import {
  cameraKey,
  finishTypeDisplayName,
  surfaceDisplayLabel,
} from "@/lib/configurator/zone-catalog";
import { isDefaultEntry } from "@/lib/configurator/storage";
import SidePanelClear from "../icons/configurator/side-panel-clear";
import SidePanelClose from "../icons/configurator/side-panel-close";
import { CustomShape } from "@/components/shared/custom-shape";
import { cn } from "@/lib/utils";

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
  defaults?: SelectionEntry[];
  viewOnly?: boolean;
  /** Tour preview: show the panel but block all interaction. */
  interactionLocked?: boolean;
  tourHighlight?: boolean;
  onClose: () => void;
};

const ZoneSidePanel = ({
  cameras,
  activeCameraKey,
  onSelectCamera,
  meshes,
  selectionMap,
  onSelectMesh,
  getMaterials,
  onSelectMaterial,
  onRemoveSelection,
  defaults,
  viewOnly,
  interactionLocked = false,
  tourHighlight = false,
  onClose,
}: Props) => {
  const activeCamera =
    cameras.find((cam) => cameraKey(cam) === activeCameraKey) ?? null;
  const activeSlot =
    activeCamera?.slot || activeCamera?.name || meshes[0]?.slot || "";
  const activeEntry = activeSlot ? selectionMap[activeSlot] : undefined;
  const activeMesh =
    meshes.find((mesh) => mesh.id === activeEntry?.meshId) ?? null;
  const variations = activeMesh ? getMaterials(activeMesh.id) : [];
  const selectedMaterial =
    variations.find((mat) => mat.id === activeEntry?.materialId) ?? null;
  const showingDefault = Boolean(
    activeMesh &&
    isDefaultEntry(defaults, {
      slot: activeSlot,
      meshId: activeMesh.id,
      materialId: selectedMaterial?.id || activeEntry?.materialId || "",
    }),
  );
  const showClear = Boolean(
    onRemoveSelection &&
    activeSlot &&
    !viewOnly &&
    !interactionLocked &&
    !showingDefault,
  );

  return (
    <div
      className={cn(
        "cfg-side-panel absolute inset-x-3 bottom-21 z-30 flex h-[min(58dvh,560px)] max-h-[min(58dvh,560px)] flex-col overflow-hidden",
        // Large screens: pin to the left and vertically center
        "md:inset-auto md:left-3 md:top-1/2 md:h-[min(734px,calc(100dvh-150px))] md:w-[min(347px,calc(100vw-24px))] md:max-h-none md:-translate-y-1/2",
        interactionLocked ? "pointer-events-none" : "pointer-events-auto",
        tourHighlight && "z-40",
      )}
      data-cfg-chrome
      data-tour-target="materials"
    >
      <CustomShape
        as="aside"
        fill="panel"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1}
        radius={{ base: 18, sm: 20, md: 24 }}
        className="flex h-full min-h-0 w-full flex-col overflow-hidden"
        aria-label="Materials"
        aria-disabled={interactionLocked || undefined}
      >
        <div className="cfg-side-panel-scroll relative z-10 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-8 touch-pan-y sm:gap-8 sm:px-7">
          <header className="flex shrink-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <h2 className="min-w-0 font-sans font-medium text-[20px] uppercase tracking-[0.6px] text-white">
                Materials
              </h2>

              <button
                type="button"
                className="relative flex size-4.5 shrink-0 items-center justify-center"
                onClick={onClose}
                disabled={interactionLocked}
                aria-label="Close materials"
              >
                <span className="relative block size-2.75 overflow-clip">
                  <SidePanelClose className="w-full h-full" />
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
              <CatalogThumb
                src={selectedMaterial.thumbnailUrl}
                alt=""
                className="size-13 shrink-0 rounded-full border border-white/20"
                sizes="52px"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans font-medium text-[14px] leading-[1.16] text-white">
                  {selectedMaterial.displayName || selectedMaterial.id}
                </p>
                {showingDefault ? (
                  <p className="mt-0.5 text-[10px] leading-[1.2] text-red-500">
                    Default
                  </p>
                ) : null}
              </div>
              {showClear ? (
                <button
                  type="button"
                  className="relative size-5.5 shrink-0 overflow-clip"
                  onClick={() => onRemoveSelection?.(activeSlot)}
                  aria-label="Clear selected material"
                >
                  <SidePanelClear className="w-full h-full" />
                </button>
              ) : null}
            </div>
          ) : activeMesh ? (
            <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pr-4 pl-1">
              <CatalogThumb
                src={activeMesh.thumbnailUrl}
                alt=""
                className="size-13 shrink-0 rounded-full border border-white/20"
                sizes="52px"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans font-medium text-[14px] leading-[1.16] text-white">
                  {finishTypeDisplayName(activeMesh)}
                </p>
                {showingDefault ? (
                  <p className="mt-0.5 text-[10px] leading-[1.2] text-red-500">
                    Default
                  </p>
                ) : null}
              </div>
              {showClear ? (
                <button
                  type="button"
                  className="relative size-5.5 shrink-0 overflow-clip"
                  onClick={() => onRemoveSelection?.(activeSlot)}
                  aria-label="Clear selected finish"
                >
                  <SidePanelClear className="w-full h-full" />
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
          <section className="flex shrink-0 flex-col gap-3.5 border-b border-white/10 pb-4.5">
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
                    className={`h-8 min-w-22 flex-1 rounded-full bg-white/5 px-4 font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-white ${
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

          <section className="flex shrink-0 flex-col gap-3.5 border-b border-white/10 pb-4.5">
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
                      className={`flex w-full items-center gap-1.75 rounded-full bg-white/5 py-1 pr-5 pl-1 text-left ${
                        selected
                          ? "border border-white/70"
                          : "border border-transparent"
                      }`}
                      onClick={() => onSelectMesh(mesh)}
                    >
                      <CatalogThumb
                        src={mesh.thumbnailUrl}
                        alt=""
                        className="size-13 shrink-0 rounded-full border border-white/20"
                        sizes="52px"
                      />
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
                        selected
                          ? "border border-white"
                          : "border border-transparent"
                      }`}
                      onClick={() => onSelectMaterial(activeMesh.id, mat)}
                    >
                      <CatalogThumb
                        src={mat.thumbnailUrl}
                        alt=""
                        className="block size-12.25 rounded-full border border-white/20"
                        sizes="49px"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
        </div>
      </CustomShape>
    </div>
  );
};

export { cameraKey };

export default ZoneSidePanel;
