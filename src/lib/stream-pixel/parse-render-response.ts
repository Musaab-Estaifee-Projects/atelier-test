import { parseUeResponse } from "@/lib/stream-pixel/parse-ue-response";

export type RenderCameraPayload = {
  name: string;
  index?: number;
  file?: string;
  image?: string;
};

export type RenderEvent = {
  kind: "started" | "capturing" | "completed" | "error" | "uploaded";
  cameraName?: string;
  cameraIndex?: number;
  file?: string;
  image?: string;
  cameraCount?: number;
  cameras?: RenderCameraPayload[];
  message?: string;
  jobId?: string;
};

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
}

function pickImage(obj: Record<string, unknown>): string | undefined {
  return (
    str(obj.image) ??
    str(obj.Image) ??
    str(obj.imageUrl) ??
    str(obj.ImageUrl) ??
    str(obj.url) ??
    str(obj.Url) ??
    str(obj.data) ??
    str(obj.Data) ??
    str(obj.base64) ??
    str(obj.Base64) ??
    str(obj.png) ??
    str(obj.Png)
  );
}

function parseCameraItem(raw: unknown, i: number): RenderCameraPayload | null {
  if (typeof raw === "string") {
    const file = /\.(png|jpe?g|webp)$/i.test(raw) ? raw : undefined;
    return { name: raw, file };
  }
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const name =
    str(c.name) ??
    str(c.Name) ??
    str(c.camera) ??
    str(c.Camera) ??
    str(c.CameraName) ??
    `Camera ${num(c.index) ?? num(c.Index) ?? i}`;
  return {
    name,
    index: num(c.index) ?? num(c.Index) ?? num(c.cameraIndex),
    file: str(c.file) ?? str(c.File) ?? str(c.filename) ?? str(c.Filename),
    image: pickImage(c),
  };
}

function parseRenderPayload(raw: unknown): RenderEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const type = String(obj.type ?? obj.Type ?? "").toLowerCase();
  const status = String(obj.status ?? obj.Status ?? "").toLowerCase();

  const isRenderType =
    type === "render" ||
    type === "screenshot" ||
    type === "capture" ||
    type === "highres" ||
    type === "uploadscreenshots" ||
    type === "uploaded";
  const isRenderStatus =
    status === "started" ||
    status === "capturing" ||
    status === "completed" ||
    status === "complete" ||
    status === "error" ||
    status === "failed" ||
    status === "uploaded";

  const msgHint = str(obj.message) ?? str(obj.Message) ?? "";
  const msgLow = msgHint.toLowerCase();
  const looksCompleted =
    status === "completed" ||
    status === "complete" ||
    status === "done" ||
    msgLow.includes("all renders completed");
  const looksStarted =
    status === "started" ||
    status === "start" ||
    msgLow.includes("started capturing");

  if (!isRenderType && !isRenderStatus && !looksCompleted && !looksStarted) {
    return null;
  }
  // OpeningLevel and cameraZone must never be treated as renders
  if (
    type === "camerazone" ||
    type === "camera_zone" ||
    type === "openinglevel"
  ) {
    return null;
  }

  const camerasRaw = obj.cameras ?? obj.Cameras;
  const cameras: RenderCameraPayload[] = [];
  if (Array.isArray(camerasRaw)) {
    camerasRaw.forEach((item, i) => {
      const parsed = parseCameraItem(item, i);
      if (parsed) cameras.push(parsed);
    });
  }

  let kind: RenderEvent["kind"] = "capturing";
  if (looksStarted) kind = "started";
  else if (looksCompleted) kind = "completed";
  else if (status === "error" || status === "failed") kind = "error";
  else if (status === "uploaded" || type === "uploaded") kind = "uploaded";
  else if (
    status === "capturing" ||
    status === "capture" ||
    type === "render"
  ) {
    kind = "capturing";
  }

  const cameraName =
    str(obj.camera) ??
    str(obj.Camera) ??
    str(obj.cameraName) ??
    str(obj.CameraName);

  return {
    kind,
    cameraName,
    cameraIndex: num(obj.index) ?? num(obj.Index) ?? num(obj.cameraIndex),
    file: str(obj.file) ?? str(obj.File),
    image: pickImage(obj),
    cameraCount:
      num(obj.cameraCount) ??
      num(obj.CameraCount) ??
      num(obj.rendersTaken) ??
      (cameras.length || undefined),
    cameras: cameras.length ? cameras : undefined,
    message: str(obj.message) ?? str(obj.Message),
    jobId: str(obj.jobId) ?? str(obj.JobId) ?? str(obj.jobID),
  };
}

export function extractRenderEvent(response: unknown): RenderEvent | null {
  try {
    const parsed = parseUeResponse(response) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;

    const candidates = [
      parsed,
      parsed.message,
      parsed.data,
      parsed.payload,
    ].filter((item) => item && typeof item !== "string");

    for (const candidate of candidates) {
      const result = parseRenderPayload(candidate);
      if (result) return result;
    }
    return null;
  } catch {
    return null;
  }
}

/** Turn UE base64 / data-URL / http URL into a displayable src. */
export function stillSrcFromPayload(raw: string | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (
    v.startsWith("blob:") ||
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("data:")
  ) {
    return v;
  }
  // bare filename is not displayable
  if (/\.(png|jpe?g|webp)$/i.test(v) && !v.includes(",")) return null;
  const compact = v.replace(/\s/g, "");
  if (compact.length < 32) return null;
  return `data:image/png;base64,${compact}`;
}

export function toBlobUrl(src: string): string {
  if (src.startsWith("blob:") || src.startsWith("http")) return src;
  if (!src.startsWith("data:")) return src;
  try {
    const [header, data] = src.split(",", 2);
    if (!data) return src;
    const mime = /data:([^;]+)/.exec(header)?.[1] ?? "image/png";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return src;
  }
}
