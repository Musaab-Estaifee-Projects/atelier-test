/** Helpers for configurator / styles URLs. Layout code always comes from the API. */

export type CatalogProject = {
  slug: string;
  name: string;
  image: string;
  handover: string;
  residences: string;
  streamProjectId: string;
  projectId: string;
  unitId: string;
  levelName: string;
  layoutCode?: string;
};

export function configuratorHref(
  project: {
    streamProjectId: string;
    layoutCode?: string;
    levelName?: string;
    projectId?: string;
    backendProjectId?: string;
    slug?: string;
  },
  extra?: {
    style?: string;
    view?: boolean;
    apartmentId?: string | null;
    apartmentNumber?: string | null;
    unit?: string | null;
    renders?: boolean;
  },
): string {
  const streamId = project.streamProjectId?.trim();
  const layoutCode = (project.layoutCode || project.levelName || "").trim();
  const selectedProjectId = project.projectId || project.backendProjectId || "";
  const q = new URLSearchParams();
  if (layoutCode) q.set("layout_code", layoutCode);
  if (project.slug) q.set("project", project.slug);
  if (selectedProjectId && /^\d+$/.test(selectedProjectId)) {
    q.set("project_id", selectedProjectId);
  }
  if (extra?.apartmentId) q.set("apartment_id", extra.apartmentId);
  const apartmentNumber = extra?.apartmentNumber || extra?.unit;
  if (apartmentNumber) q.set("apartment_number", apartmentNumber);
  if (extra?.style) q.set("style", extra.style);
  if (extra?.view) q.set("view", "1");
  if (extra?.renders) q.set("renders", "1");
  const qs = q.toString();
  return qs ? `/configurator/${streamId}?${qs}` : `/configurator/${streamId}`;
}

export function stylesHref(project: {
  slug?: string;
  layoutCode?: string;
  levelName?: string;
  projectId?: string;
  apartmentId?: string;
  apartmentNumber?: string;
  unitId?: string;
}): string {
  const q = new URLSearchParams();
  const layoutCode = (project.layoutCode || project.levelName || "").trim();
  if (layoutCode) q.set("layout_code", layoutCode);
  if (project.slug) q.set("project", project.slug);
  if (project.projectId && /^\d+$/.test(project.projectId)) {
    q.set("project_id", project.projectId);
  }
  const apartmentNumber = project.apartmentNumber || project.unitId;
  if (apartmentNumber) q.set("apartment_number", apartmentNumber);
  if (project.apartmentId) q.set("apartment_id", project.apartmentId);
  const qs = q.toString();
  return qs ? `/styles?${qs}` : "/styles";
}
