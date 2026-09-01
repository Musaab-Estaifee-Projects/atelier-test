import { ROLES } from "@/constants/const";

export type RoleId = (typeof ROLES)[number]["id"];

export type ContactInfo = {
  name: string;
  email: string;
  phone: string;
  role: RoleId;
};

export type MenuId = "search" | "type" | "layout" | null;
