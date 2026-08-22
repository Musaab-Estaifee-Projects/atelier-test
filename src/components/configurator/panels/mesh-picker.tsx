"use client";

import type { ConfiguratorCamera, MeshOption } from "@/types/configurator";

type Props = {
  activeCamera: ConfiguratorCamera | undefined;
  meshes: MeshOption[];
  selectedMeshId: string | null | undefined;
  onSetMesh: (mesh: MeshOption) => void;
  pending?: boolean;
  cameraPending?: boolean;
  error?: string | null;
};

/**
 * Mesh variants for the currently selected camera.
 * Data comes from mesh-rules (static today → API later).
 */
export default function MeshPicker({
  activeCamera,
  meshes,
  selectedMeshId,
  onSetMesh,
  pending = false,
  cameraPending = false,
  error = null,
}: Props) {
  return (
    <div className="mesh-picker-panel" data-testid="mesh-picker-panel">
      <p className="mesh-picker-title">
        {activeCamera
          ? `Mesh variants · ${activeCamera.name} (#${activeCamera.index})`
          : "Select a camera to see mesh variants"}
      </p>

      {activeCamera && meshes.length > 0 ? (
        <div className="mesh-picker-list">
          {meshes.map((mesh) => (
            <button
              key={mesh.id}
              type="button"
              disabled={pending || cameraPending}
              className={`camera-zone-btn mesh-variant-btn ${
                selectedMeshId === mesh.id ? "camera-zone-btn-active" : ""
              }`}
              onClick={() => onSetMesh(mesh)}
            >
              <span className="camera-zone-name">
                {mesh.displayName || mesh.id}
              </span>
            </button>
          ))}
        </div>
      ) : activeCamera ? (
        <p className="mesh-picker-empty">
          No mesh variants configured for this camera.
        </p>
      ) : (
        <p className="mesh-picker-empty">
          Click a camera above to load its mesh options.
        </p>
      )}

      {error && (
        <p className="camera-zone-error">Mesh change failed: {error}</p>
      )}
    </div>
  );
}
