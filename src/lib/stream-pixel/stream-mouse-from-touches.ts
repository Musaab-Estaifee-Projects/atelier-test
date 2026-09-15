/**
 * Unreal free-camera input is mouse-shaped:
 * tap a point → go there, double-click, press-and-hold then drag → look.
 * Convert one-finger stream touches into mouse/pointer events on the video only.
 * Chrome UI is outside this listener (siblings, higher z-index).
 */
type PlayerRoot = {
  rootElement?: HTMLElement | null;
  stream?: { videoElementParent?: HTMLElement | null };
};

const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 28;
const MOVE_PX = 6;

function playerRoot(app: PlayerRoot): HTMLElement | null {
  return app.stream?.videoElementParent ?? app.rootElement ?? null;
}

function isChromeTouch(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "[data-cfg-chrome], .cfg-dock, .cfg-zone-bar, .cfg-side-panel, .cfg-dock-wrap",
    ),
  );
}

function mouseInit(touch: Touch, buttons: number): MouseEventInit {
  return {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
    button: 0,
    buttons,
    detail: 1,
  };
}

function dispatchMouse(
  target: HTMLElement,
  type: string,
  touch: Touch,
  buttons: number,
  detail = 1,
): void {
  const init = { ...mouseInit(touch, buttons), detail };
  target.dispatchEvent(new MouseEvent(type, init));
  if (typeof PointerEvent === "undefined") return;
  const pointerType =
    type === "mousedown"
      ? "pointerdown"
      : type === "mousemove"
        ? "pointermove"
        : type === "mouseup"
          ? "pointerup"
          : null;
  if (!pointerType) return;
  target.dispatchEvent(
    new PointerEvent(pointerType, {
      ...init,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      pressure: buttons ? 0.5 : 0,
    }),
  );
}

export function wireStreamMouseFromTouches(app: PlayerRoot): () => void {
  const root = playerRoot(app);
  if (!root || typeof window === "undefined") return () => undefined;

  let activeId: number | null = null;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let lastTapAt = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  const onStart = (event: TouchEvent) => {
    if (isChromeTouch(event.target)) return;
    if (event.touches.length !== 1) return;
    const video = root.querySelector("video") ?? root;
    const t = event.changedTouches[0];
    if (!t) return;
    activeId = t.identifier;
    startX = t.clientX;
    startY = t.clientY;
    moved = false;
    event.preventDefault();
    dispatchMouse(video, "mousemove", t, 0);
    dispatchMouse(video, "mousedown", t, 1);
  };

  const onMove = (event: TouchEvent) => {
    if (activeId == null) return;
    if (isChromeTouch(event.target)) return;
    const video = root.querySelector("video") ?? root;
    const t = Array.from(event.changedTouches).find(
      (item) => item.identifier === activeId,
    );
    if (!t) return;
    if (
      Math.abs(t.clientX - startX) > MOVE_PX ||
      Math.abs(t.clientY - startY) > MOVE_PX
    ) {
      moved = true;
    }
    event.preventDefault();
    dispatchMouse(video, "mousemove", t, 1);
  };

  const onEnd = (event: TouchEvent) => {
    if (activeId == null) return;
    const video = root.querySelector("video") ?? root;
    const t = Array.from(event.changedTouches).find(
      (item) => item.identifier === activeId,
    );
    if (!t) return;
    activeId = null;
    event.preventDefault();
    dispatchMouse(video, "mouseup", t, 0);
    if (!moved) {
      const now = Date.now();
      const isDouble =
        now - lastTapAt <= DOUBLE_TAP_MS &&
        Math.abs(t.clientX - lastTapX) <= DOUBLE_TAP_PX &&
        Math.abs(t.clientY - lastTapY) <= DOUBLE_TAP_PX;
      if (isDouble) {
        dispatchMouse(video, "click", t, 0, 2);
        dispatchMouse(video, "dblclick", t, 0, 2);
        lastTapAt = 0;
      } else {
        dispatchMouse(video, "click", t, 0, 1);
        lastTapAt = now;
        lastTapX = t.clientX;
        lastTapY = t.clientY;
      }
    }
  };

  const opts: AddEventListenerOptions = { capture: true, passive: false };
  root.addEventListener("touchstart", onStart, opts);
  root.addEventListener("touchmove", onMove, opts);
  root.addEventListener("touchend", onEnd, opts);
  root.addEventListener("touchcancel", onEnd, opts);

  return () => {
    root.removeEventListener("touchstart", onStart, opts);
    root.removeEventListener("touchmove", onMove, opts);
    root.removeEventListener("touchend", onEnd, opts);
    root.removeEventListener("touchcancel", onEnd, opts);
  };
}
