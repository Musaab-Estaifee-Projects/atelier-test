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
  DesignCode: string;
};

export type LoadCustomizationPayload = {
  Function: "LoadCustomization";
  DesignCode: string;
};

export type ResetToDefaultPayload = {
  Function: "ResetToDefault";
};

export type CaptureCamerasHighResPayload = {
  Function: "CaptureCamerasHighRes";
  DesignCode: string;
};

export type CaptureCamerasPayload = {
  Function: "CaptureCameras";
  DesignCode: string;
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
