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
  thumbnailUrl?: string;
  pricePerSqm?: number;
  isDefault?: boolean;
};

export type MaterialOption = {
  id: string;
  displayName: string;
  category?: string;
  pricePerSqm?: number;
  /** Fixed item price when not area-based */
  fixedPrice?: number;
  thumbnailUrl?: string;
  isDefault?: boolean;
};

export type CameraRule = {
  index?: number;
  name: string;
  mode?: string;
  meshIds: string[];
  /** Selection slot = camera UE id */
  slot?: string;
  zoneId?: string;
};

export type ZoneCameraRef = {
  name: string;
  mode: string;
};

export type ZoneDefinition = {
  id: string;
  label: string;
  ueZone: string;
  cameras: ZoneCameraRef[];
};

export type MeshRulesConfig = {
  cameras: CameraRule[];
  meshes: MeshOption[];
};

/**
 * Shareable URL contract.
 * /configurator/{stream_id}?project_id=&layout_code=&apartment_id=&apartment_number=&zone=&camera=&renders=
 * Mesh/material and design_code are NEVER in the URL.
 */
export type ShareableConfiguratorParams = {
  streamId: string;
  backendProjectId: string | null;
  unit?: string | null;
  apartmentId?: string | null;
  apartmentNumber?: string | null;
  layoutCode?: string | null;
  camera?: string | null;
  zone?: string | null;
  view?: boolean;
  renders?: boolean;
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
  layoutCode: string;
  backendProjectId: string;
  /** From layout catalog when the API sends identity fields. */
  residence?: {
    projectName?: string;
    categoryName?: string;
    typeName?: string;
    area?: string | null;
  };
  cameras: CameraRule[];
  meshes: MeshOption[];
  materials: MaterialOption[];
  materialsByMesh: Record<string, string[]>;
  meshAreas: MeshArea[];
  slotLabels: Record<string, string>;
  zones: ZoneDefinition[];
  defaults?: SelectionEntry[];
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

export type LocalDraft = {
  version: 3;
  streamProjectId: string;
  projectId: string;
  layoutCode: string;
  apartmentId?: string | null;
  designCode: string;
  selections: import("@/types/stored-selection").StoredSelection[];
  selectionRevision: 0;
  summaryToken?: string | null;
  summaryExpiresAt?: string | null;
  prepareIdempotencyKey?: string | null;
  retryIdempotencyKey?: string | null;
  highResCaptureSent?: boolean;
  updatedAt: string;
};
