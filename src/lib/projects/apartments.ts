import {
  DEMO_LEVEL_NAME,
  DEMO_UNIT_ID,
} from "@/lib/projects/catalog";

export type ResidenceType = {
  id: string;
  label: string;
};

export type LayoutOption = {
  id: string;
  label: string;
  typeId: string;
  unitId: string;
  levelName: string;
};

export type CatalogUnit = {
  id: string;
  label: string;
  aliases: string[];
  typeId: string;
  layoutId: string;
  unitId: string;
  levelName: string;
};

export const RESIDENCE_TYPES: ResidenceType[] = [
  { id: "1bhk", label: "1 Bedroom" },
  { id: "2bhk", label: "2 Bedrooms" },
  { id: "3bhk", label: "3 Bedrooms" },
];

/** Every layout maps to the live StreamPixel unit so Continue always works. */
export const LAYOUTS: LayoutOption[] = [
  {
    id: "1bhk-a",
    label: "Type A",
    typeId: "1bhk",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "2bhk-a",
    label: "Type A",
    typeId: "2bhk",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "2bhk-b",
    label: "Type B",
    typeId: "2bhk",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "3bhk-a",
    label: "Type A",
    typeId: "3bhk",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "3bhk-b",
    label: "Type B",
    typeId: "3bhk",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
];

export const CATALOG_UNITS: CatalogUnit[] = [
  {
    id: "101",
    label: "101 · 1 Bedroom · Type A",
    aliases: ["101", "t01", "1bhk-t01", "lo-apt-1bhk-t01"],
    typeId: "1bhk",
    layoutId: "1bhk-a",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "201",
    label: "201 · 2 Bedrooms · Type A",
    aliases: ["201", "t02", "2bhk-t02", "lo-apt-2bhk-t02", DEMO_UNIT_ID.toLowerCase()],
    typeId: "2bhk",
    layoutId: "2bhk-a",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "202",
    label: "202 · 2 Bedrooms · Type B",
    aliases: ["202", "2bhk-t03", "lo-apt-2bhk-t03"],
    typeId: "2bhk",
    layoutId: "2bhk-b",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "301",
    label: "301 · 3 Bedrooms · Type A",
    aliases: ["301", "3bhk-t01", "lo-apt-3bhk-t01"],
    typeId: "3bhk",
    layoutId: "3bhk-a",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
  {
    id: "302",
    label: "302 · 3 Bedrooms · Type B",
    aliases: ["302", "3bhk-t02", "lo-apt-3bhk-t02"],
    typeId: "3bhk",
    layoutId: "3bhk-b",
    unitId: DEMO_UNIT_ID,
    levelName: DEMO_LEVEL_NAME,
  },
];

export function layoutsForType(typeId: string): LayoutOption[] {
  return LAYOUTS.filter((layout) => layout.typeId === typeId);
}

export function findUnit(query: string): CatalogUnit | undefined {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return undefined;
  return CATALOG_UNITS.find(
    (unit) =>
      unit.id.toLowerCase() === q ||
      unit.unitId.toLowerCase() === q ||
      unit.aliases.includes(q),
  );
}

export function searchUnits(query: string): CatalogUnit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  return CATALOG_UNITS.filter(
    (unit) =>
      unit.id.toLowerCase().includes(q) ||
      unit.label.toLowerCase().includes(q) ||
      unit.unitId.toLowerCase().includes(q) ||
      unit.aliases.some((alias) => alias.includes(q)),
  ).slice(0, 5);
}

export function isDesignCode(query: string): boolean {
  return /^AT-?[A-Z0-9]{4,}$/i.test(query.trim());
}

export function normalizeDesignCode(query: string): string {
  const raw = query.trim().toUpperCase().replace(/\s+/g, "");
  return raw.startsWith("AT-") ? raw : raw.replace(/^AT/, "AT-");
}
