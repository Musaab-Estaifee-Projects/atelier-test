"use client";

import { createPortal } from "react-dom";
import type {
  ConfiguratorCamera,
  MaterialOption,
  MeshOption,
} from "@/types/configurator";
import LevelPicker from "./level-picker";
import MeshPicker from "./mesh-picker";
import MaterialPicker from "./material-picker";

type Props = {
  zoneName: string | null;
  cameras: ConfiguratorCamera[];
  activeCameraIndex: number | null;
  onSwitchCamera: (camera: ConfiguratorCamera) => void;
  onExitCamera: () => void;
  cameraPending?: boolean;
  cameraError?: string | null;

  levels: string[];
  activeLevel: string;
  onLoadLevel: (levelName: string) => void;
  levelPending?: boolean;
  levelError?: string | null;

  meshes: MeshOption[];
  selectedMeshId: string | null | undefined;
  onSetMesh: (mesh: MeshOption) => void;
  meshPending?: boolean;
  meshError?: string | null;

  materials: MaterialOption[];
  selectedMaterialId: string | null | undefined;
  onApplyMaterial: (material: MaterialOption) => void;
  materialPending?: boolean;
  materialError?: string | null;

  loadId?: string;
  onLoadIdChange?: (value: string) => void;
  onLoad?: () => void;
  onSave?: () => void;
  loadPending?: boolean;
  savePending?: boolean;
  loadError?: string | null;
  saveError?: string | null;

  activeCamera: ConfiguratorCamera | undefined;
  isStreamLoading?: boolean;
  onClose: () => void;

  /** When true, hide mesh/material editors and save/load */
  viewOnly?: boolean;
  showLevelPicker?: boolean;

  /** Dev-only test inject (optional) */
  onLoadTestCameras?: () => void;
  lastRawUeResponse?: unknown;
};

function indexesMatch(
  a: number | null | undefined,
  b: number | null | undefined,
) {
  return a != null && b != null && Number(a) === Number(b);
}

/**
 * Left-side configurator panel (portal to body so it sits above the stream).
 * Meeting UX: materials on the left; Select Material toggles this surface.
 */
export default function CameraZonePanel(props: Props) {
  const {
    zoneName,
    cameras,
    activeCameraIndex,
    onSwitchCamera,
    onExitCamera,
    cameraPending = false,
    cameraError = null,
    levels,
    activeLevel,
    onLoadLevel,
    levelPending = false,
    levelError = null,
    meshes,
    selectedMeshId,
    onSetMesh,
    meshPending = false,
    meshError = null,
    materials,
    selectedMaterialId,
    onApplyMaterial,
    materialPending = false,
    materialError = null,
    activeCamera,
    isStreamLoading = false,
    onClose,
    viewOnly = false,
    showLevelPicker = true,
    onLoadTestCameras,
    lastRawUeResponse,
  } = props;

  const panel = (
    <div
      className="camera-zone-panel"
      data-testid="camera-zone-panel"
      data-lenis-prevent
    >
      <div className="camera-zone-header">
        <span className="camera-zone-title">{zoneName || "Cameras"}</span>
        <button
          type="button"
          className="stats-popup-close"
          onClick={onClose}
          aria-label="Close cameras"
        >
          &times;
        </button>
      </div>

      {showLevelPicker && !viewOnly && (
        <LevelPicker
          levels={levels}
          activeLevel={activeLevel}
          onLoadLevel={onLoadLevel}
          pending={levelPending}
          error={levelError}
        />
      )}

      <div className="exit-camera-panel">
        <button
          type="button"
          className="camera-zone-btn exit-camera-btn"
          disabled={cameraPending}
          onClick={onExitCamera}
        >
          Exit camera
        </button>
      </div>

      {cameras.length > 0 ? (
        <>
          <p className="camera-zone-subtitle">{cameras.length} available</p>
          <div className="camera-zone-body">
            <div className="camera-zone-list">
              {cameras.map((camera) => {
                const isActive = indexesMatch(camera.index, activeCameraIndex);
                return (
                  <button
                    key={`${camera.index}-${camera.name}`}
                    type="button"
                    disabled={cameraPending}
                    className={`camera-zone-btn ${
                      isActive ? "camera-zone-btn-active" : ""
                    }`}
                    onClick={() => onSwitchCamera(camera)}
                  >
                    <span className="camera-zone-name">{camera.name}</span>
                    <span className="camera-zone-meta">
                      #{camera.index}
                      {camera.mode ? ` · ${camera.mode}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            {cameraError && (
              <p className="camera-zone-error">
                Camera switch failed: {cameraError}
              </p>
            )}
          </div>

          {!viewOnly && (
            <>
              <MeshPicker
                activeCamera={activeCamera}
                meshes={meshes}
                selectedMeshId={selectedMeshId}
                onSetMesh={onSetMesh}
                pending={meshPending}
                cameraPending={cameraPending}
                error={meshError}
              />

              <MaterialPicker
                meshId={selectedMeshId}
                materials={materials}
                selectedMaterialId={selectedMaterialId}
                onApplyMaterial={onApplyMaterial}
                pending={materialPending}
                meshPending={meshPending}
                cameraPending={cameraPending}
                error={materialError}
              />
            </>
          )}
        </>
      ) : isStreamLoading ? (
        <div className="camera-zone-empty">
          <p>Stream connecting…</p>
          <p className="camera-zone-empty-hint">
            Camera list will appear when you enter a zone in UE.
          </p>
        </div>
      ) : (
        <div className="camera-zone-empty">
          <p>No cameras in zone yet</p>
          <p className="camera-zone-empty-hint">
            Walk into a camera zone in UE, or use the test button below.
          </p>
          {onLoadTestCameras && (
            <button
              type="button"
              className="dev-tools-btn camera-zone-test-btn"
              onClick={onLoadTestCameras}
            >
              Load test cameras
            </button>
          )}
          {lastRawUeResponse != null && (
            <pre className="camera-zone-debug">{String(lastRawUeResponse)}</pre>
          )}
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}
