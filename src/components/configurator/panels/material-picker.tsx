"use client";

import type { MaterialOption } from "@/types/configurator";

type Props = {
  meshId: string | null | undefined;
  materials: MaterialOption[];
  selectedMaterialId: string | null | undefined;
  onApplyMaterial: (material: MaterialOption) => void;
  pending?: boolean;
  meshPending?: boolean;
  cameraPending?: boolean;
  error?: string | null;
};

/**
 * Materials allowed for the selected mesh.
 * FUTURE: show thumbnails + pricePerSqm from materials API.
 */
export default function MaterialPicker({
  meshId,
  materials,
  selectedMaterialId,
  onApplyMaterial,
  pending = false,
  meshPending = false,
  cameraPending = false,
  error = null,
}: Props) {
  if (!meshId) return null;

  if (materials.length === 0) {
    return (
      <p className="mesh-picker-empty">
        No material options for this mesh variant.
      </p>
    );
  }

  return (
    <div
      className="material-picker-section"
      data-testid="material-picker-panel"
    >
      <p className="material-picker-title">Materials · {meshId}</p>
      <div className="material-picker-list">
        {materials.map((material) => (
          <button
            key={material.id}
            type="button"
            disabled={pending || meshPending || cameraPending}
            className={`camera-zone-btn material-variant-btn ${
              selectedMaterialId === material.id ? "camera-zone-btn-active" : ""
            }`}
            onClick={() => onApplyMaterial(material)}
          >
            <span className="camera-zone-name">
              {material.displayName || material.id}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="camera-zone-error">Material change failed: {error}</p>
      )}
    </div>
  );
}
