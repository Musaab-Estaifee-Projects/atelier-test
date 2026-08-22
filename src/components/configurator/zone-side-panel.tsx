// src/components/configurator/zone-side-panel.tsx
"use client";

import type {
  CameraRule,
  MaterialOption,
  MeshOption,
  SelectionMap,
} from "@/types/configurator";
import { cameraDisplayLabel } from "@/lib/configurator/zone-catalog";
import { slotFromMeshId } from "@/mocks/configurator/session";
import GlassSelect from "./glass-select";

type Props = {
  zoneLabel: string;
  cameras: CameraRule[];
  activeCameraKey: string | null;
  onSelectCamera: (camera: CameraRule) => void;
  meshes: MeshOption[];
  selectionMap: SelectionMap;
  onSelectMesh: (mesh: MeshOption) => void;
  getMaterials: (meshId: string) => MaterialOption[];
  onSelectMaterial: (meshId: string, material: MaterialOption) => void;
  viewOnly?: boolean;
  onClose: () => void;
};

function cameraKey(c: CameraRule): string {
  return `${c.name}|${c.mode ?? ""}|${c.index ?? ""}`;
}

function meshSlot(mesh: MeshOption): string {
  return mesh.slot || slotFromMeshId(mesh.id);
}

export default function ZoneSidePanel({
  zoneLabel,
  cameras,
  activeCameraKey,
  onSelectCamera,
  meshes,
  selectionMap,
  onSelectMesh,
  getMaterials,
  onSelectMaterial,
  viewOnly,
  onClose,
}: Props) {
  return (
    <aside className="cfg-side-panel" aria-label={`${zoneLabel} customization`}>
      <header className="cfg-side-panel-header">
        <div>
          <p className="cfg-side-panel-eyebrow">Zone</p>
          <h2 className="cfg-side-panel-title">{zoneLabel}</h2>
        </div>
        <button
          type="button"
          className="cfg-icon-btn"
          onClick={onClose}
          aria-label="Close panel"
        >
          ×
        </button>
      </header>

      <section className="cfg-side-section">
        <h3 className="cfg-side-section-title">Cameras</h3>
        <ul className="cfg-camera-list">
          {cameras.map((cam) => {
            const key = cameraKey(cam);
            const active = activeCameraKey === key;
            return (
              <li
                key={key}
                className={`cfg-camera-item${active ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  className="cfg-camera-btn"
                  onClick={() => onSelectCamera(cam)}
                >
                  {cameraDisplayLabel(cam)}
                </button>

                {active && (
                  <div className="cfg-mesh-block">
                    {viewOnly ? (
                      <p className="cfg-muted">View only — finishes locked</p>
                    ) : meshes.length === 0 ? (
                      <p className="cfg-muted">No mesh options</p>
                    ) : (
                      meshes.map((mesh) => {
                        const slot = meshSlot(mesh);
                        const entry = selectionMap[slot];
                        const meshActive = entry?.meshId === mesh.id;
                        const mats = getMaterials(mesh.id);
                        const selectedMatId = meshActive
                          ? (entry?.materialId ?? "")
                          : "";
                        return (
                          <div
                            key={mesh.id}
                            className={`cfg-mesh-row${meshActive ? " is-active" : ""}`}
                          >
                            <button
                              type="button"
                              className="cfg-mesh-btn"
                              aria-pressed={meshActive}
                              onClick={() => onSelectMesh(mesh)}
                            >
                              {mesh.displayName || mesh.id}
                            </button>

                            {meshActive && mats.length > 1 && (
                              <GlassSelect
                                aria-label="Material"
                                value={selectedMatId}
                                options={mats.map((m) => ({
                                  id: m.id,
                                  label: m.displayName || m.id,
                                }))}
                                onChange={(id) => {
                                  const m = mats.find((x) => x.id === id);
                                  if (m) onSelectMaterial(mesh.id, m);
                                }}
                              />
                            )}

                            {meshActive && mats.length === 1 && (
                              <p className="cfg-mat-fixed">
                                {mats[0].displayName || mats[0].id}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}

export { cameraKey };
