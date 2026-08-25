/**
 * Unreal Engine UI interaction contract.
 * These Function names must match the Blueprints exposed via emitUIInteraction.
 * When client docs change, update only this file + the handlers that call them.
 */

export type SwitchCameraPayload = {
  Function: "SwitchCameraByIndex";
  Index: number;
  ZoneName?: string;
};

export type SwitchCameraByNamePayload = {
  Function: "SwitchCameraByName";
  CameraName: string;
  Mode?: string;
};

export type MoveToZonePayload = {
  Function: "MoveToZone";
  ZoneName: string;
};

export type ExitCameraPayload = {
  Function: "ExitCamera";
};

export type SetMeshPayload = {
  Function: "SetMeshByName";
  MeshName: string;
  Slot?: string;
  CameraName?: string;
  CameraIndex?: number;
  Index?: number;
};

export type ApplyMaterialPayload = {
  Function: "ApplyMaterialToMesh";
  MeshName: string;
  MaterialName: string;
  Slot?: string;
  CameraName?: string;
  CameraIndex?: number;
  Index?: number;
};

export type LoadLevelPayload = {
  Function: "LoadLevel";
  LevelName: string;
};

export type SaveCustomizationPayload = {
  Function: "SaveCustomization";
  UnitId?: string;
  LoadID?: string;
  Selections?: Array<{
    Slot: string;
    MeshName: string;
    MaterialName?: string;
    CameraName?: string;
    CameraIndex?: number;
  }>;
};

export type LoadCustomizationPayload = {
  Function: "LoadCustomization";
  LoadID: string;
  UnitId?: string;
};

export type ResetCustomizationPayload = {
  Function: "ResetCustomization";
};

export type ResetSlotPayload = {
  Function: "ResetSlot" | "ClearSlot" | "ResetMeshBySlot";
  Slot: string;
};

export type ApplyConfigurationPayload = {
  Function: "ApplyConfiguration";
  Selections: Array<{
    Slot: string;
    MeshName: string;
    MaterialName?: string;
    CameraName?: string;
    CameraIndex?: number;
  }>;
};

/**
 * Bulk off-screen capture (ATELIER-Rules).
 * UE captures SceneCapture cameras in the background — FE must NOT SwitchCamera.
 * Live Pixel Streaming resolution stays untouched (multi-user GPU budget).
 */
export type CaptureCamerasHighResPayload = {
  Function: "CaptureCamerasHighRes";
  JobId: string;
  Width: number;
  Height: number;
  Format?: "png" | "jpg";
};

/** Single-camera retry when one still fails. Same off-screen path — no pawn move. */
export type CaptureCameraHighResPayload = {
  Function: "CaptureCameraHighRes";
  JobId: string;
  CameraName?: string;
  CameraIndex?: number;
  Index?: number;
  Width: number;
  Height: number;
  Format?: "png" | "jpg";
};

/**
 * Alternate single-camera Blueprint name (some builds).
 * Prefer CaptureCameraHighRes; this is a fallback only.
 */
export type CaptureHighResScreenshotPayload = {
  Function: "CaptureHighResScreenshot";
  JobId: string;
  CameraIndex: number;
  CameraName?: string;
  ZoneName?: string;
  Width: number;
  Height: number;
};

/** Ask UE to push stills to S3 / return URLs when events only contain filenames. */
export type UploadScreenshotsPayload = {
  Function: "UploadScreenshots";
  JobId: string;
  Files?: string[];
};

/** Best-effort zone entry for share deep-links (UE Blueprint may use one of these). */
export type EnterZonePayload = {
  Function:
    | "EnterZone"
    | "GoToZone"
    | "TeleportToZone"
    | "EnterCameraZone"
    | "TeleportToArea";
  ZoneName?: string;
  Zone?: string;
  AreaName?: string;
};

export type UeInteractionPayload =
  | SwitchCameraPayload
  | SwitchCameraByNamePayload
  | MoveToZonePayload
  | ExitCameraPayload
  | SetMeshPayload
  | ApplyMaterialPayload
  | SaveCustomizationPayload
  | LoadCustomizationPayload
  | LoadLevelPayload
  | ResetCustomizationPayload
  | ResetSlotPayload
  | ApplyConfigurationPayload
  | CaptureCamerasHighResPayload
  | CaptureCameraHighResPayload
  | CaptureHighResScreenshotPayload
  | UploadScreenshotsPayload
  | EnterZonePayload
  | Record<string, unknown>; // escape hatch for dev tools only
