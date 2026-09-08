const OVERLAY_IDS = [
  "playOverlay",
  "connectOverlay",
  "connectStatus",
  "infoOverlay",
  "videoPlayOverlay",
  "streamingStateOverlay",
  "uiFeatures",
  "afkOverlay",
] as const;

/** Epic/StreamPixel UI looks up these nodes by id and writes `.style`. */
export function ensureSdkOverlayStubs(host?: HTMLElement | null): void {
  if (typeof document === "undefined") return;
  const parent = host ?? document.body;
  for (const id of OVERLAY_IDS) {
    if (document.getElementById(id)) continue;
    const el = document.createElement("div");
    el.id = id;
    el.setAttribute("aria-hidden", "true");
    el.style.display = "none";
    el.style.pointerEvents = "none";
    parent.appendChild(el);
  }
}
