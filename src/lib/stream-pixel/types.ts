/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal typing around StreamPixel SDK objects we actually use.
 * The published package is untyped; keep this narrow and extend as needed.
 */

export type StreamPixelUiControl = {
  getResolution?: () => unknown;
  getStreamStats?: () => Record<string, string | number> | null;
  setResolution?: (opts: {
    width?: number;
    height?: number;
    label?: string;
  }) => void;
  toggleHoveringMouse?: (enabled: boolean) => void;
};

export type StreamPixelInstance = {
  emitUIInteraction?: (payload: Record<string, unknown>) => void;
  emitConsoleCommand?: (cmd: string) => void;
  disconnect?: () => void;
  addResponseEventListener?: (
    name: string,
    handler: (response: unknown) => void,
  ) => void;
  removeResponseEventListener?: (name: string) => void;
  addEventListener?: (event: string, handler: (e?: any) => void) => void;
  removeEventListener?: (event: string, handler: (e?: any) => void) => void;
};

export type AppStreamInstance = {
  rootElement?: HTMLElement;
  uiFeaturesElement?: HTMLElement;
  onVideoInitialized?: () => void;
  onDisconnect?: () => void;
  stream?: {
    videoElementParent?: HTMLElement;
    _webRtcController?: {
      streamController?: {
        audioElement?: HTMLAudioElement;
      };
    };
  };
};

export type ResolutionOption = {
  label: string;
  width?: number;
  height?: number;
};

export const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { label: "Auto (Dashboard)" },
  { label: "720p", width: 1280, height: 720 },
  { label: "1080p", width: 1920, height: 1080 },
  { label: "1440p", width: 2560, height: 1440 },
];
