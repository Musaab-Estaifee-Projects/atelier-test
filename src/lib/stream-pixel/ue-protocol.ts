/**
 * Unreal Engine UI interaction contract.
 * Function names and keys must match the Blueprints exposed via emitUIInteraction.
 */

export type SwitchCameraByNamePayload = {
  Function: "SwitchCameraByName";
  CameraName: string;
};

export type MoveToZonePayload = {
  Function: "MoveToZone";
  ZoneName: string;
};

export type ExitCameraPayload = {
  Function: "ExitCamera";
};

export type ChangeMeshPayload = {
  Function: "ChangeMeshByName";
  MeshName: string;
};

export type ApplyMaterialPayload = {
  Function: "ApplyMaterialToMesh";
  MeshName: string;
  MaterialName: string;
};

export type LoadLevelPayload = {
  Function: "LoadLevel";
  LevelName: string;
};

export type SaveCustomizationPayload = {
  Function: "SaveCustomization";
  design_code: string;
};

export type LoadCustomizationPayload = {
  Function: "LoadCustomization";
  design_code: string;
};

export type ResetToDefaultPayload = {
  Function: "ResetToDefault";
};

export type CaptureCamerasHighResPayload = {
  Function: "CaptureCamerasHighRes";
  design_code: string;
};

export type CaptureCamerasPayload = {
  Function: "CaptureCameras";
  design_code: string;
  CameraNames: string[];
};

export type UeInteractionPayload =
  | SwitchCameraByNamePayload
  | MoveToZonePayload
  | ExitCameraPayload
  | ChangeMeshPayload
  | ApplyMaterialPayload
  | SaveCustomizationPayload
  | LoadCustomizationPayload
  | LoadLevelPayload
  | ResetToDefaultPayload
  | CaptureCamerasHighResPayload
  | CaptureCamerasPayload
  | Record<string, unknown>;
