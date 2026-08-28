/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ambient types for streampixelsdk (no official @types package).
 * Covers the surface we use in the Atelier configurator.
 * Extend as you adopt more SDK APIs.
 *
 * Install: git+https://github.com/infinity-void-metaverse/Streampixel-Web-SDK.git#latest
 * Docs:   https://docs.streampixel.io/resources/web-sdk/getting-started/installation
 */

declare module "streampixelsdk" {
  export type StreamPixelConfig = {
    /** Required — project ID from Streampixel dashboard */
    appId: string;
    AutoConnect?: boolean;
    streamerId?: string;
    sfuHost?: string | boolean;
    sfuPlayer?: string | boolean;
    forceTurn?: boolean;
    AutoPlayVideo?: boolean;

    // Codec
    primaryCodec?: "AV1" | "H264" | "VP9" | "VP8" | string;
    fallBackCodec?: string;
    preferredCodec?: string;

    // Resolution / quality
    maxStreamQuality?: string;
    startResolution?: string;
    startResolutionMobile?: string;
    startResolutionTab?: string;
    resolutionMode?: string;
    showResolution?: boolean;
    minBitrate?: number;
    maxBitrate?: number;
    minQP?: number;
    maxQP?: number;

    // Input
    mouseInput?: boolean;
    keyBoardInput?: boolean;
    touchInput?: boolean;
    hoverMouse?: boolean;
    gamepadInput?: boolean;
    xrInput?: boolean;
    fakeMouseWithTouches?: boolean;

    // Audio / camera
    useMic?: boolean;
    useCamera?: boolean;

    // AFK
    afktimeout?: number;

    [key: string]: unknown;
  };
  export type PixelStreamingInstance = {
    emitUIInteraction: (payload: Record<string, unknown>) => void;
    emitConsoleCommand: (cmd: string) => void;
    disconnect: () => void;
    unmuteMicrophone?: (enabled: boolean) => void;
    unmuteCamera?: (enabled: boolean) => void;
    addResponseEventListener: (
      name: string,
      handler: (response: unknown) => void,
    ) => void;
    removeResponseEventListener: (name: string) => void;
    addEventListener: (event: string, handler: (e?: any) => void) => void;
    removeEventListener: (event: string, handler: (e?: any) => void) => void;
  };

  export type AppStreamInstance = {
    rootElement: HTMLElement;
    uiFeaturesElement?: HTMLElement;
    onVideoInitialized: (() => void) | null;
    onDisconnect?: (() => void) | null;
    stream?: {
      videoElementParent?: HTMLElement;
      _webRtcController?: {
        streamController?: {
          audioElement?: HTMLAudioElement;
        };
      };
    };
  };

  export type UIControlInstance = {
    getResolution: () => unknown;
    setResolution?: (opts: {
      width?: number;
      height?: number;
      label?: string;
    }) => void;
    getStreamStats?: () => Record<string, string | number> | null;
    toggleHoveringMouse?: (enabled: boolean) => void;
    toggleAudio?: () => void;
  };

  export type ReconnectStreamInstance = {
    on: (
      event: "state",
      handler: (data: {
        status: string;
        code?: number;
        reason?: string;
      }) => void,
    ) => void;
  };

  export type QueueHandler = (
    callback: (msg: { position: number; message?: string }) => void,
  ) => void;

  export type StreamPixelApplicationResult = {
    appStream: AppStreamInstance;
    pixelStreaming: PixelStreamingInstance;
    queueHandler: QueueHandler;
    UIControl: UIControlInstance;
    reconnectStream: ReconnectStreamInstance;
  };

  export function StreamPixelApplication(
    config: StreamPixelConfig,
  ): Promise<StreamPixelApplicationResult>;

  const StreamPixelApplicationDefault: typeof StreamPixelApplication;
  export default StreamPixelApplicationDefault;
}
