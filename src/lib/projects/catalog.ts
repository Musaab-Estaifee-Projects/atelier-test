/** Marketing projects on the Select a Project screen. */
export type CatalogProject = {
  slug: string;
  name: string;
  image: string;
  handover: string;
  residences: string;
  streamProjectId: string;
  unitId: string;
  levelName: string;
};

/** Shared StreamPixel session until each tower has its own app id. */
export const DEMO_STREAM_PROJECT_ID = "6a427d215af97179992c7c66";
export const DEMO_UNIT_ID = "LO-APT-2BHK-T02";
export const DEMO_LEVEL_NAME = "2BHK_Type_2_Updated";

export const CATALOG_PROJECTS: CatalogProject[] = [
  {
    slug: "reef-996",
    name: "REEF 996",
    image: "/images/projects/reef-996.png",
    handover: "Q1 2028",
    residences: "63 Residences",
    streamProjectId: DEMO_STREAM_PROJECT_ID,
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    slug: "reef-997",
    name: "REEF 997",
    image: "/images/projects/reef-997.png",
    handover: "Q1 2028",
    residences: "63 Residences",
    streamProjectId: DEMO_STREAM_PROJECT_ID,
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    slug: "reef-998",
    name: "REEF 998",
    image: "/images/projects/reef-998.png",
    handover: "Q1 2028",
    residences: "63 Residences",
    streamProjectId: DEMO_STREAM_PROJECT_ID,
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
];

export function getProject(slug: string): CatalogProject | undefined {
  return CATALOG_PROJECTS.find((p) => p.slug === slug);
}

export function configuratorHref(
  project: Pick<CatalogProject, "streamProjectId" | "unitId" | "levelName">,
  extra?: { designCode?: string; style?: string },
): string {
  const q = new URLSearchParams({
    unit: project.unitId,
    level: project.levelName,
  });
  if (extra?.designCode) q.set("designCode", extra.designCode);
  if (extra?.style) q.set("style", extra.style);
  return `/configurator/${project.streamProjectId}?${q.toString()}`;
}

export function stylesHref(
  project: Pick<CatalogProject, "slug" | "unitId" | "levelName">,
): string {
  const q = new URLSearchParams({
    project: project.slug,
    unit: project.unitId,
    level: project.levelName,
  });
  return `/styles?${q.toString()}`;
}
