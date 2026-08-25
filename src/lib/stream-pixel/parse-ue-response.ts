import type { ConfiguratorCamera } from "@/types/configurator";

export type CameraZoneEvent = {
  event: "enter" | "exit" | string;
  zone: string | null;
  cameras: ConfiguratorCamera[];
};

/** UE sometimes double-encodes JSON strings. */
export function parseUeResponse(response: unknown): unknown {
  let data: unknown =
    typeof response === "string" ? JSON.parse(response) : response;
  if (typeof data === "string") data = JSON.parse(data);
  return data;
}

function parseCameraZonePayload(raw: unknown): CameraZoneEvent | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const type = String(obj.type ?? obj.Type ?? "").toLowerCase();
  if (
    type === "render" ||
    type === "screenshot" ||
    type === "capture" ||
    type === "highres" ||
    type === "openinglevel"
  ) {
    return null;
  }
  const status = String(obj.status ?? obj.Status ?? "").toLowerCase();
  if (
    status === "started" ||
    status === "capturing" ||
    status === "completed" ||
    status === "complete" ||
    status === "uploaded"
  ) {
    return null;
  }
  const rawCameras =
    obj.cameras ?? obj.Cameras ?? obj.cameraList ?? obj.CameraList;

  const hasType = type === "camerazone" || type === "camera_zone";
  const hasCameras =
    rawCameras &&
    (Array.isArray(rawCameras)
      ? rawCameras.length > 0
      : typeof rawCameras === "object" &&
        Object.keys(rawCameras as object).length > 0);

  if (!hasType && !hasCameras) return null;

  const event = String(obj.event ?? obj.Event ?? "enter").toLowerCase();
  const zone =
    (obj.zone as string) ??
    (obj.Zone as string) ??
    (obj.zoneName as string) ??
    (obj.ZoneName as string) ??
    null;

  const list = Array.isArray(rawCameras)
    ? rawCameras
    : Object.values((rawCameras as object) || {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameras: ConfiguratorCamera[] = list.map((c: any, i: number) => ({
    name:
      c?.name ??
      c?.Name ??
      c?.label ??
      c?.Label ??
      `Camera ${c?.index ?? c?.Index ?? i + 1}`,
    index: Number(c?.index ?? c?.Index ?? i),
    mode: c?.mode ?? c?.Mode ?? "",
  }));

  return { event, zone, cameras };
}

export function extractCameraZoneFromResponse(
  response: unknown,
): CameraZoneEvent | null {
  try {
    const parsed = parseUeResponse(response) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;

    const candidates = [
      parsed,
      parsed.message,
      parsed.data,
      parsed.payload,
    ].filter((item) => item && typeof item === "object");

    for (const candidate of candidates) {
      const result = parseCameraZonePayload(candidate);
      if (result) return result;
    }
    return null;
  } catch {
    return null;
  }
}

export type CustomizationEvent = {
  kind: "saved" | "loaded" | "error";
  loadId?: string;
};

function pickLoadId(obj: Record<string, unknown>): string | undefined {
  const keys = [
    "LoadID",
    "loadID",
    "LoadId",
    "loadId",
    "SaveID",
    "saveID",
    "SaveId",
    "saveId",
    "CustomizationID",
    "customizationId",
    "CustomizationId",
    "id",
    "ID",
  ];
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function parseCustomizationPayload(raw: unknown): CustomizationEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const type = String(
    obj.type ?? obj.Type ?? obj.event ?? obj.Event ?? obj.Function ?? "",
  ).toLowerCase();
  const loadId = pickLoadId(obj);
  const looksSaved =
    type.includes("savecustom") ||
    type.includes("customizationsaved") ||
    type.includes("savedcustom") ||
    type === "saved";
  const looksLoaded =
    type.includes("loadcustom") ||
    type.includes("customizationloaded") ||
    type.includes("loadedcustom") ||
    type === "loaded";
  const looksError =
    type.includes("customizationerror") ||
    (type.includes("customization") &&
      String(obj.status ?? obj.Status ?? "").toLowerCase() === "error");

  if (looksError) return { kind: "error", loadId };
  if (looksSaved) return { kind: "saved", loadId };
  if (looksLoaded) return { kind: "loaded", loadId };
  if (loadId && type.includes("custom")) return { kind: "saved", loadId };
  return null;
}

export function extractCustomizationEvent(
  response: unknown,
): CustomizationEvent | null {
  try {
    const parsed = parseUeResponse(response) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const candidates = [
      parsed,
      parsed.message,
      parsed.data,
      parsed.payload,
      parsed.result,
    ].filter((item) => item && typeof item === "object");
    for (const candidate of candidates) {
      const result = parseCustomizationPayload(candidate);
      if (result) return result;
    }
    return null;
  } catch {
    return null;
  }
}
