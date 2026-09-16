import { ROLES } from "@/constants/const";

export type RoleId = (typeof ROLES)[number]["id"];

export type ContactInfo = {
  name: string;
  email: string;
  phone: string;
  role: RoleId;
};

export type MenuId = "search" | "type" | "layout" | null;

// APIs:
export type TProjectType = {
  id: number;
  name: string;
  /** Catalog layout code (same as apartment search `layout.code`). */
  code?: string;
  layout_code: string;
  layout_area: string;
};

export type TProjectCategory = {
  id: number;
  name: string;
  types: TProjectType[];
};

export type TProject = {
  id: number;
  code: string;
  name: string;
  streampixel_app_id?: string;
  image: string;
  handover: string;
  apartments_count: number;
  categories?: TProjectCategory[];
};
