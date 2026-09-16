/**
 * Unreal free camera via Pixel Streaming mouse protocol:
 * hold one finger and drag → look (L/R/U/D)
 * double-tap → MouseDouble (go to that point)
 * Single tap does not teleport.
 *
 * Sends toStreamerHandlers when available so iOS/Safari/Android all work
 * (synthetic MouseEvents often have movementX=0 and broken offsetX).
 */

type PlayerRoot = {
  rootElement?: HTMLElement | null;
  stream?: {
    videoElementParent?: HTMLElement | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const DOUBLE_TAP_MS = 380;
const DOUBLE_TAP_PX = 36;
const LOOK_PX = 4;

type Coord = { x: number; y: number };
type Handlers = { get: (name: string) => ((args?: unknown) => void) | undefined };

function isChromeTouch(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "[data-cfg-chrome], .cfg-dock, .cfg-zone-bar, .cfg-side-panel, .cfg-dock-wrap",
    ),
  );
}

function clamp16(n: number) {
  return Math.max(0, Math.min(65535, Math.round(n)));
}

function signed16(n: number) {
  const v = Math.round(n);
  return Math.max(-32768, Math.min(32767, v));
}

function walk(obj: unknown, depth = 0): unknown[] {
  if (!obj || typeof obj !== "object" || depth > 4) return [];
  const record = obj as Record<string, unknown>;
  return [
    obj,
    record.stream,
    record._webRtcController,
    record.webRtcController,
    record.streamController,
    record.streamMessageController,
    record.videoPlayer,
    record.mouseController,
  ].filter(Boolean);
}

function findHandlers(app: PlayerRoot, pixelStreaming?: unknown): Handlers | null {
  const seen = new Set<unknown>();
  const queue: unknown[] = [app, pixelStreaming, app.stream];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    const rec = cur as Record<string, unknown>;
    const smc = rec.streamMessageController as
      | { toStreamerHandlers?: Handlers }
      | undefined;
    const handlers = smc?.toStreamerHandlers ?? (rec.toStreamerHandlers as Handlers | undefined);
    if (handlers && typeof handlers.get === "function" && handlers.get("MouseMove")) {
      return handlers;
    }
    for (const next of walk(cur)) queue.push(next);
  }
  return null;
}

function findConverter(
  app: PlayerRoot,
  pixelStreaming?: unknown,
): {
  translateUnsigned?: (x: number, y: number) => Coord;
  translateSigned?: (x: number, y: number) => Coord;
} | null {
  const seen = new Set<unknown>();
  const queue: unknown[] = [app, pixelStreaming, app.stream];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    const rec = cur as Record<string, unknown>;
    const conv = (rec.coordinateConverter ?? rec) as {
      translateUnsigned?: (x: number, y: number) => Coord;
      translateSigned?: (x: number, y: number) => Coord;
    };
    if (typeof conv.translateUnsigned === "function") return conv;
    for (const next of walk(cur)) queue.push(next);
  }
  return null;
}

function localPoint(surface: HTMLElement, clientX: number, clientY: number) {
  const r = surface.getBoundingClientRect();
  const w = r.width || 1;
  const h = r.height || 1;
  return {
    x: clientX - r.left,
    y: clientY - r.top,
    w,
    h,
  };
}

function unsignedFallback(surface: HTMLElement, clientX: number, clientY: number): Coord {
  const p = localPoint(surface, clientX, clientY);
  return {
    x: clamp16((p.x / p.w) * 65536),
    y: clamp16((p.y / p.h) * 65536),
  };
}

function signedFallback(surface: HTMLElement, dx: number, dy: number): Coord {
  const r = surface.getBoundingClientRect();
  const w = r.width || 1;
  const h = r.height || 1;
  return {
    x: signed16((dx / w) * 65536),
    y: signed16((dy / h) * 65536),
  };
}

function dispatchOnSurface(
  surface: HTMLElement,
  type: string,
  clientX: number,
  clientY: number,
  buttons: number,
  movementX = 0,
  movementY = 0,
  detail = 1,
) {
  surface.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX,
      clientY,
      screenX: clientX,
      screenY: clientY,
      movementX,
      movementY,
      button: 0,
      buttons,
      detail,
    }),
  );
}

type StreamMouse = {
  enter: () => void;
  down: (clientX: number, clientY: number) => void;
  up: (clientX: number, clientY: number) => void;
  move: (
    clientX: number,
    clientY: number,
    dx: number,
    dy: number,
  ) => void;
  dbl: (clientX: number, clientY: number) => void;
};

function createStreamMouse(
  surface: HTMLElement,
  app: PlayerRoot,
  pixelStreaming?: unknown,
): StreamMouse {
  const handlers = findHandlers(app, pixelStreaming);
  const converter = findConverter(app, pixelStreaming);

  const toUnsigned = (clientX: number, clientY: number) => {
    const p = localPoint(surface, clientX, clientY);
    if (converter?.translateUnsigned) return converter.translateUnsigned(p.x, p.y);
    return unsignedFallback(surface, clientX, clientY);
  };
  const toSigned = (dx: number, dy: number) => {
    if (converter?.translateSigned) return converter.translateSigned(dx, dy);
    return signedFallback(surface, dx, dy);
  };

  if (handlers) {
    return {
      enter: () => handlers.get("MouseEnter")?.(),
      down: (clientX, clientY) => {
        const c = toUnsigned(clientX, clientY);
        handlers.get("MouseDown")?.([0, c.x, c.y]);
      },
      up: (clientX, clientY) => {
        const c = toUnsigned(clientX, clientY);
        handlers.get("MouseUp")?.([0, c.x, c.y]);
      },
      move: (clientX, clientY, dx, dy) => {
        const c = toUnsigned(clientX, clientY);
        const d = toSigned(dx, dy);
        handlers.get("MouseMove")?.([c.x, c.y, d.x, d.y]);
      },
      dbl: (clientX, clientY) => {
        const c = toUnsigned(clientX, clientY);
        handlers.get("MouseMove")?.([c.x, c.y, 0, 0]);
        handlers.get("MouseDouble")?.([0, c.x, c.y]);
      },
    };
  }

  return {
    enter: () => dispatchOnSurface(surface, "mouseenter", 0, 0, 0),
    down: (clientX, clientY) =>
      dispatchOnSurface(surface, "mousedown", clientX, clientY, 1),
    up: (clientX, clientY) =>
      dispatchOnSurface(surface, "mouseup", clientX, clientY, 0),
    move: (clientX, clientY, dx, dy) =>
      dispatchOnSurface(surface, "mousemove", clientX, clientY, 1, dx, dy),
    dbl: (clientX, clientY) => {
      dispatchOnSurface(surface, "mousemove", clientX, clientY, 0);
      dispatchOnSurface(surface, "dblclick", clientX, clientY, 0, 0, 0, 2);
    },
  };
}

export function wireStreamMouseFromTouches(
  app: PlayerRoot,
  pixelStreaming?: unknown,
): () => void {
  const surface =
    app.stream?.videoElementParent ??
    app.rootElement ??
    (typeof document !== "undefined"
      ? (document.querySelector("video") as HTMLElement | null)
      : null);
  if (!surface || typeof window === "undefined") return () => undefined;

  const mouse = createStreamMouse(surface, app, pixelStreaming);
  mouse.enter();

  let activeId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let startX = 0;
  let startY = 0;
  let looking = false;
  let moved = false;
  let lastTapAt = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  const isDoubleCandidate = (x: number, y: number) => {
    const now = Date.now();
    return (
      now - lastTapAt <= DOUBLE_TAP_MS &&
      Math.abs(x - lastTapX) <= DOUBLE_TAP_PX &&
      Math.abs(y - lastTapY) <= DOUBLE_TAP_PX
    );
  };

  const endLook = (x: number, y: number) => {
    if (!looking) return;
    looking = false;
    mouse.up(x, y);
  };

  const startLook = (x: number, y: number) => {
    if (looking) return;
    looking = true;
    mouse.move(x, y, 0, 0);
    mouse.down(x, y);
  };

  const onStart = (event: TouchEvent) => {
    if (isChromeTouch(event.target)) return;
    if (event.touches.length !== 1) {
      if (activeId != null) endLook(lastX, lastY);
      activeId = null;
      return;
    }
    const t = event.changedTouches[0];
    if (!t) return;
    event.preventDefault();
    activeId = t.identifier;
    lastX = startX = t.clientX;
    lastY = startY = t.clientY;
    moved = false;

    if (isDoubleCandidate(t.clientX, t.clientY)) {
      return;
    }
  };

  const onMove = (event: TouchEvent) => {
    if (activeId == null) return;
    const t = Array.from(event.changedTouches).find(
      (item) => item.identifier === activeId,
    );
    if (!t) return;
    event.preventDefault();
    const dx = t.clientX - lastX;
    const dy = t.clientY - lastY;
    lastX = t.clientX;
    lastY = t.clientY;
    if (
      Math.abs(t.clientX - startX) > LOOK_PX ||
      Math.abs(t.clientY - startY) > LOOK_PX
    ) {
      moved = true;
      lastTapAt = 0;
      if (!looking) startLook(t.clientX, t.clientY);
    }
    if (looking && (dx !== 0 || dy !== 0)) {
      mouse.move(t.clientX, t.clientY, dx, dy);
    }
  };

  const onEnd = (event: TouchEvent) => {
    if (activeId == null) return;
    const t = Array.from(event.changedTouches).find(
      (item) => item.identifier === activeId,
    );
    if (!t) return;
    event.preventDefault();
    activeId = null;
    const x = t.clientX;
    const y = t.clientY;

    if (looking) {
      endLook(x, y);
      if (moved) {
        lastTapAt = 0;
        return;
      }
    }

    if (isDoubleCandidate(x, y)) {
      mouse.dbl(x, y);
      lastTapAt = 0;
      return;
    }

    lastTapAt = Date.now();
    lastTapX = x;
    lastTapY = y;
  };

  const opts: AddEventListenerOptions = { capture: true, passive: false };
  const nodes: EventTarget[] = [surface];
  const video = surface.querySelector?.("video");
  if (video) nodes.push(video);

  for (const node of nodes) {
    node.addEventListener("touchstart", onStart as EventListener, opts);
    node.addEventListener("touchmove", onMove as EventListener, opts);
    node.addEventListener("touchend", onEnd as EventListener, opts);
    node.addEventListener("touchcancel", onEnd as EventListener, opts);
  }

  return () => {
    for (const node of nodes) {
      node.removeEventListener("touchstart", onStart as EventListener, opts);
      node.removeEventListener("touchmove", onMove as EventListener, opts);
      node.removeEventListener("touchend", onEnd as EventListener, opts);
      node.removeEventListener("touchcancel", onEnd as EventListener, opts);
    }
  };
}
