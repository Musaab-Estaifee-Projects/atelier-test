/** Camera coming from UE cameraZone events (or local overrides). */
export type ConfiguratorCamera = {
  name: string;
  index: number;
  mode?: string;
  /** Stable camera id for selections (e.g. CAM-LV-TV) */
  id?: string;
};

export type MeshOption = {
  id: string;
  displayName: string;
  /** Slot this mesh belongs to when known */
  slot?: string;
};

export type MaterialOption = {
  id: string;
  displayName: string;
  category?: string;
  pricePerSqm?: number;
  /** Fixed item price when not area-based */
  fixedPrice?: number;
  thumbnailUrl?: string;
};

export type CameraRule = {
  index?: number;
  name: string;
  mode?: string;
  meshIds: string[];
  /** Selection slot for this camera (e.g. living-tv-wall) */
  slot?: string;
};

export type MeshRulesConfig = {
  cameras: CameraRule[];
  meshes: MeshOption[];
};

/**
 * Shareable URL contract.
 * EDIT:  /configurator/{streamProjectId}?unit=...&level=...&camera=&zone=
 * VIEW:  ...&designCode=AT-9F3K2
 *
 * Mesh/material are NEVER in the URL — only localStorage until submit.
 */
export type ShareableConfiguratorParams = {
  projectId: string;
  unit?: string | null;
  designCode?: string | null;
  level?: string | null;
  camera?: number | null;
  zone?: string | null;
  streamerId?: string | null;
  sfuHost?: string | null;
  sfuPlayer?: string | null;
};

export type ConfiguratorMode = "EDIT" | "VIEW_ONLY";

/** One committed finish selection (slot = surface being customized). */
export type SelectionEntry = {
  slot: string;
  meshId: string;
  materialId: string;
  cameraId?: string;
  /** UE camera index at pick time — required to re-apply on reload */
  cameraIndex?: number;
};

export type SelectionMap = Record<
  string,
  {
    meshId: string;
    materialId: string;
    cameraId?: string;
    cameraIndex?: number;
  }
>;

export type MeshArea = {
  meshId: string;
  areaSqm: number;
};

export type ConfiguratorSession = {
  streamProjectId: string;
  unitId: string;
  levelName: string;
  cameras: CameraRule[];
  meshes: MeshOption[];
  materials: MaterialOption[];
  materialsByMesh: Record<string, string[]>;
  meshAreas: MeshArea[];
  slotLabels: Record<string, string>;
  defaults?: SelectionEntry[];
};

export type DesignConfiguration = {
  version: 1;
  levelName: string;
  selections: SelectionEntry[];
  meta?: { source?: string };
};

export type DesignContact = {
  name: string;
  email: string;
  phone: string;
};

export type StoredDesign = {
  designCode: string;
  streamProjectId: string;
  unitId: string;
  configuration: DesignConfiguration;
  contact: DesignContact;
  price: number;
  currency: string;
  createdAt: string;
};

export type SubmitDesignResult = {
  designCode: string;
  shareUrl: string;
  price: number;
  currency: string;
};

export type RoomStillStatus = "queued" | "rendering" | "completed" | "error";

export type RoomCameraStill = {
  cameraName: string;
  cameraIndex?: number;
  file?: string;
  imageUrl?: string;
};

export type RoomRenderCard = {
  zoneId: string;
  label: string;
  ueZone: string;
  heroCameraName: string;
  heroCameraIndex: number;
  status: RoomStillStatus;
  imageUrl?: string;
  error?: string;
  attempt: number;
  stills: RoomCameraStill[];
};

export type FinalDesignPhase = "idle" | "confirm" | "capturing" | "review";

export type LocalDraft = {
  version: 1;
  streamProjectId: string;
  unitId: string;
  levelName: string;
  selections: SelectionEntry[];
  /** UE SaveCustomization id — used with LoadCustomization after reload / stream drop */
  ueLoadId?: string;
  /** Reserved — camera/zone live in the URL only, never persisted here */
  ui?: Record<string, never>;
  updatedAt: string;
};
