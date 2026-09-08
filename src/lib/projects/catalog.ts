/** Marketing projects on the Select a Project screen. */
export type CatalogProject = {
  slug: string;
  name: string;
  image: string;
  handover: string;
  residences: string;
  streamProjectId: string;
  /** Selected marketing/backend project id — never the StreamPixel app id. */
  projectId: string;
  unitId: string;
  levelName: string;
  layoutCode?: string;
};

/** Shared StreamPixel session until each tower has its own app id. */
export const DEMO_STREAM_PROJECT_ID = "6a427d215af97179992c7c66";
/** Backend catalog project id until it is supplied by the API. */
export const DEMO_BACKEND_PROJECT_ID = "6a427d215af97179992c7c66";
export const DEMO_UNIT_ID = "LO-APT-2BHK-T02";
export const DEMO_LEVEL_NAME = "1bhk_type_3";
export const DEFAULT_LAYOUT_CODE = "1bhk_type_3";

export const CATALOG_PROJECTS: CatalogProject[] = [
  {
    slug: "reef-996",
    name: "REEF 996",
    image: "/images/projects/reef-996.png",
    handover: "Q1 2028",
    residences: "63 Residences",
    streamProjectId: DEMO_STREAM_PROJECT_ID,
    projectId: "reef-996",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
    layoutCode: DEFAULT_LAYOUT_CODE,
  },
  {
    slug: "reef-997",
    name: "REEF 997",
    image: "/images/projects/reef-997.png",
    handover: "Q1 2028",
    residences: "63 Residences",
    streamProjectId: DEMO_STREAM_PROJECT_ID,
    projectId: "reef-997",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
    layoutCode: DEFAULT_LAYOUT_CODE,
  },
  {
    slug: "reef-998",
    name: "REEF 998",
    image: "/images/projects/reef-998.png",
    handover: "Q1 2028",
    residences: "63 Residences",
    streamProjectId: DEMO_STREAM_PROJECT_ID,
    projectId: "reef-998",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
    layoutCode: DEFAULT_LAYOUT_CODE,
  },
];

export function getProject(slug: string): CatalogProject | undefined {
  return CATALOG_PROJECTS.find((p) => p.slug === slug);
}

export function configuratorHref(
  project: Pick<CatalogProject, "streamProjectId" | "levelName"> & {
    layoutCode?: string;
    projectId?: string;
    backendProjectId?: string;
  },
  extra?: { designCode?: string; style?: string; view?: boolean },
): string {
  const layoutCode =
    project.layoutCode || project.levelName || DEFAULT_LAYOUT_CODE;
  const selectedProjectId =
    project.projectId || project.backendProjectId || "";
  const q = new URLSearchParams({
    layout_code: layoutCode,
  });
  if (selectedProjectId) q.set("project_id", selectedProjectId);
  if (extra?.designCode) q.set("design_code", extra.designCode);
  if (extra?.style) q.set("style", extra.style);
  if (extra?.view) q.set("view", "1");
  return `/configurator/${project.streamProjectId}?${q.toString()}`;
}

export function stylesHref(
  project: Pick<CatalogProject, "slug" | "unitId" | "levelName"> & {
    layoutCode?: string;
    projectId?: string;
  },
): string {
  const q = new URLSearchParams({
    project: project.slug,
    layout_code: project.layoutCode || project.levelName || DEFAULT_LAYOUT_CODE,
  });
  if (project.projectId) q.set("project_id", project.projectId);
  if (project.unitId) q.set("unit", project.unitId);
  return `/styles?${q.toString()}`;
}
