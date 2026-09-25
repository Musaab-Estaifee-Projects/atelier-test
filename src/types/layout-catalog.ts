export type LayoutCatalogMaterial = {
  name: string;
  ue_id: string;
  price: number | null;
  is_default: boolean;
  unit: string;
  image?: string | null;
};

export type LayoutCatalogMesh = {
  name: string;
  ue_id: string;
  dimension: number | null;
  unit: string;
  price: number | null;
  is_default: boolean;
  image: string | null;
  materials: LayoutCatalogMaterial[];
};

export type LayoutCatalogCamera = {
  name: string;
  ue_id: string;
  meshes: LayoutCatalogMesh[];
};

export type LayoutCatalogZone = {
  name: string;
  ue_id: string;
  cameras: LayoutCatalogCamera[];
};

export type LayoutCatalogData = {
  code: string;
  project?: {
    id?: number;
    code?: string;
    name?: string;
  } | null;
  category?: {
    id?: number;
    name?: string;
  } | null;
  type?: {
    id?: number;
    name?: string;
  } | null;
  /** Omitted when the layout has no area. */
  area?: string | number | null;
  camera_zones: LayoutCatalogZone[];
};

export type LayoutCatalogResponse = {
  message: string;
  data: LayoutCatalogData;
};
